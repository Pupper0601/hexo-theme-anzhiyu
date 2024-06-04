const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');

const filePath = 'source/_data/updates.yml';
const user = 'Pupper0601';
const repo = 'HexoNote';
const token = decrypt('Z2hwX0VUN0lpc2h4SE5ZV09OY1ROcTFhYnBSaFd4dmt3RzNqc1pJcw==');
const id = getFirstCommitId(filePath);


// 解密函数
function decrypt(encryptedToken) {
  return atob(encryptedToken);
}

async function getGitHubCommits(user, repo, token, id = '', page = 1) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${user}/${repo}/commits?page=${page}`, {
      headers: {
        'Authorization': `token ${token}`
      }
    });
    if (response.data.length === 0) {
      return [];
    } else {
      let commits = [];
      if (id !== '' && response.data.find(commit => commit.sha === id)) {
        commits = response.data.slice(0, response.data.findIndex(commit => commit.sha === id));
        return commits;
      } else {
        commits = response.data;
      }
      if (response.data.length === 30) {
        const nextCommits = await getGitHubCommits(user, repo, token, id, page + 1);
        commits = commits.concat(nextCommits);
      }
      return commits;
    }
  } catch (error) {
    console.error(error);
  }
}


function padZero(num) {
  return num < 10 ? '0' + num : num;
}


function getFirstCommitId(filePath) {
  let id = '';
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContent);
      if (data[0].day_list[0].log_list.length > 0) {
        id = data[0].day_list[0].log_list[0].id;
      }
    }
    console.log(id);
    return id;
  } catch (err) {
    console.log(id);
    return id;
  }
}

function updateLogs() {
  getGitHubCommits(user, repo, token, id).then(commits => {
    const logs = [];
    for (i in commits) {
      const data = commits[i];
      logs.push({
        sha: data.sha,
        date: new Date(data.commit.author.date),
        message: data.commit.message,
        url: data.html_url
      });
    }
    console.log(logs);
    const groupedLogs = logs.reduce((acc, log) => {
      const year = log.date.getFullYear();
      const day = `${padZero(log.date.getMonth() + 1)}-${padZero(log.date.getDate())}`;

      if (!acc[year]) {
        acc[year] = [];
      }

      let dayLog = acc[year].find(d => d.day === day);
      if (!dayLog) {
        dayLog = {
          day,
          log_list: []
        };
        acc[year].push(dayLog);
      }

      dayLog.log_list.push({
        content: log.message,
        short_id: log.sha.substring(0, 7),
        id: log.sha,
        url: log.url
      });
      return acc;
    }, {});
    const result = Object.entries(groupedLogs).map(([year, day_list]) => ({
      year,
      day_list: day_list.sort((a, b) => b.day.localeCompare(a.day)) // 对 day 进行倒序排序
    })).sort((a, b) => b.year - a.year); // 对 year 进行倒序排序

    if (id !== '') {
      const fileData = yaml.load(fs.readFileSync(filePath, 'utf8'));
      // 遍历新的日志数据
      result.forEach(newLog => {
        const yearItem = fileData.find(item => item.year === newLog.year);
        if (yearItem) {
          newLog.day_list.forEach(newDay => {
            const dayItem = yearItem.day_list.find(item => item.day === newDay.day);
            if (dayItem) {
              // 如果存在相同的日期，直接在该日期的日志列表中插入新的日志
              dayItem.log_list.push(...newDay.log_list);
            } else {
              // 如果不存在相同的日期，创建一个新的日期，并将新的日志插入到该日期的日志列表中
              yearItem.day_list.push(newDay);
            }
          });
        } else {
          // 如果不存在相同的年份，直接插入新的年份
          fileData.push(newLog);
        }
      });
      // 对年份进行倒序排序
      fileData.sort((a, b) => b.year - a.year);

      // 对每个年份的日期进行倒序排序
      fileData.forEach(item => {
        item.day_list.sort((a, b) => b.day.localeCompare(a.day));
      });

      const yamlStr = yaml.dump(fileData);
      fs.writeFile(filePath, yamlStr, function (err) {
        if (err) {
          console.error(`更新 update.yml 时出错: ${err}`);
        } else {
          console.log('更新 update.yml 成功!');
        }
      });
    } else {
      const yamlStr = yaml.dump(result);

      fs.writeFile(filePath, yamlStr, function (err) {
        if (err) {
          console.error(`写入 update.yml 时出错: ${err}`);
        } else {
          console.log('写入 update.yml 成功!');
        }
      });
    }
  });
}

// updateLogs()

hexo.extend.filter.register('before_generate', async () => {
  if (hexo.env.cmd !== 'server') {
    updateLogs();
    console.log('博客修改记录更新成功!');
  }
});
