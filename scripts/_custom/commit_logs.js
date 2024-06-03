const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

function padZero(number) {
  return number < 10 ? '0' + number : number;
}

function updateLogs() {
  exec('git log --pretty=format:"%h - %H - %s - %cd"', { encoding: 'utf8' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行的错误: ${error}`);
      return;
    }
    let commits = stdout.split('\n').map(line => {
      let [shortId, longId, ...messageAndDate] = line.split(' - ');
      let message = messageAndDate.slice(0, -1).join(' - ');
      let date = new Date(messageAndDate.slice(-1)[0]);
      return { shortId, longId, message, date };
    });

    let groupedCommits = commits.reduce((acc, commit) => {
      let year = commit.date.getFullYear();
      let day = `${padZero(commit.date.getMonth() + 1)}-${padZero(commit.date.getDate())}`;

      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][day]) {
        acc[year][day] = [];
      }

      acc[year][day].push({
        content: commit.message,
        short_id: commit.shortId,
        id: commit.longId
      });

      return acc;
    }, {});

    let sortedCommits = Object.entries(groupedCommits).sort((a, b) => b[0] - a[0]).map(([year, days]) => {
      return {
        year: parseInt(year),
        day_list: Object.entries(days).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([day, log_list]) => {
          return { day, log_list };
        })
      };
    });

    fs.writeFile('source/_data/updates.yml', yaml.dump(sortedCommits), 'utf8', function (err) {
      if (err) {
        console.error(`写入文件时出错: ${err}`);
      } else {
        console.log('成功写入文件');
      }
    });
  });
}

hexo.extend.filter.register('before_generate', async () => {
  if (hexo.env.cmd !== 'server') {
    updateLogs();
    console.log('博客修改记录更新成功!');
  }
});
