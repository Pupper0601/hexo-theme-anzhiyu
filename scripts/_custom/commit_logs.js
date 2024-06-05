const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

const filePath = 'source/_data/updates.yml';
const create = 'Pupper0601/HexoNote';
let sinceId = '';
let data = [];

async function updateLogs() {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    data = yaml.load(fileContent);
    if (data !== undefined) {
      if (data.length > 0 && data[0].day_list.length > 0 && data[0].day_list[0].log_list.length > 0) {
        sinceId = data[0].day_list[0].log_list[0].short_id;
      }
    }
  }

  const command = sinceId ? `git log --pretty=format:"%ad||%s||%h||%H" --date=format:"%Y-%m-%d %H:%M:%S" ${sinceId}..HEAD` : 'git log --pretty=format:"%ad||%s||%h||%H" --date=format:"%Y-%m-%d %H:%M:%S"';
  console.log(command);
  exec(command, (error, stdout) => {
    if (error) {
      console.error(`执行的错误: ${error}`);
      return;
    }

    const newLogs = stdout.split('\n').map(log => {
      const [date, content, short_id, id] = log.split('||');
      const year = date.split(' ')[0].split('-')[0];
      const day = date.split(' ')[0].split('-').slice(1).join('-');

      return {
        year,
        day,
        commit: {
          content,
          short_id,
          id,
          url: `https://github.com/${create}/commit/${id}`,
          update: date.split(' ')[1]
        }
      };
    }).sort((a, b) => {
      // 按照年份和日期进行倒序排序
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.day.localeCompare(a.day);
    });

    console.log("更新数量: " + newLogs.length + " ---> " + newLogs);

    newLogs.forEach(log => {
      let yearObj = data.find(item => item.year === log.year);
      if (!yearObj) {
        yearObj = {
          year: log.year,
          day_list: []
        };
        data.push(yearObj);  // 添加到数组末尾
      }

      let dayObj = yearObj.day_list.find(item => item.day === log.day);
      if (!dayObj) {
        dayObj = {
          day: log.day,
          log_list: []
        };
        yearObj.day_list.push(dayObj);  // 添加到数组末尾
      }

      dayObj.log_list.push(log.commit);  // 添加到数组末尾
    });

    // 对年份进行倒序排序
    data.sort((a, b) => b.year.localeCompare(a.year));

    // 对每个年份中的日期进行倒序排序
    data.forEach(yearObj => {
      yearObj.day_list.sort((a, b) => b.day.localeCompare(a.day));

      // 对每个日期中的提交按照时间进行倒序排序
      yearObj.day_list.forEach(dayObj => {
        dayObj.log_list.sort((a, b) => new Date(b.time) - new Date(a.time));
      });
    });

    const yamlStr = yaml.dump(data);
    fs.writeFileSync(filePath, yamlStr);
    console.log("更新 updates.yaml 成功");
  })
}

// updateLogs()

// 如果需要调试, 需要注销以下代码
hexo.extend.filter.register('before_generate', async () => {
  if (hexo.env.cmd !== 'server') {
    updateLogs();
    console.log('博客修改记录更新成功!');
  }
});

