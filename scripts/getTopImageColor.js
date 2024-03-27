// 自动设置文章的 cover 和 main_color 两个字段
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yaml = require('js-yaml');
const https = require('https'); // Make sure to import this module
const { type } = require('os');

const POSTS_DIR = process.cwd() + '/source/_posts';
const RANDOM_IMG = 'https://random-img.pupper.cn/api';

// Define httpsAgent right after your imports and before the function calls
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function getCoverImage() {
    try {
        const response = await axios.get(RANDOM_IMG, {
            maxRedirects: 0,
            validateStatus: status => status === 302,
            httpsAgent // Use the agent here
        });
        return response.headers.location;
    } catch (error) {
        console.error('Error fetching cover image:', error);
    }
}

async function getMainColor(url) {
    try {
        const response = await axios.get(`${url}?imageAve`);
        const mainColorData = response.data.RGB; // Access the RGB field
        const mainColor = `#${mainColorData.slice(2)}`;
        return mainColor;
    } catch (error) {
        console.error('Error fetching main color:', error);
    }
}

function processFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            processFiles(fullPath);
        } else if (path.extname(fullPath) === '.md') {
            addCoverAndMainColor(fullPath);
        }
    }
}

function formatISO8601ToCustomFormat(isoDateString) {
    // 检查输入是否已经是目标格式（"yyyy-MM-dd HH:mm:ss"）
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(isoDateString)) {
        return -1; // 如果已经是目标格式，则直接返回
    }
    const date = new Date(isoDateString);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


async function addCoverAndMainColor(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const yamlSection = content.match(/---\n([\s\S]*?)---/);

    if (!yamlSection) return;

    const data = yaml.load(yamlSection[1]);

    let updated = false;

    if (data.date) {
        const _date = formatISO8601ToCustomFormat(data.date);
        if (_date === -1) {
            updated = false;
        } else {
            data.date = _date
            updated = true;
        }
    }

    if (data.update) {
        const _update = formatISO8601ToCustomFormat(data.update);
        if (_update === -1) {
            updated = false;
        } else {
            data.update = _update
            updated = true;
        }
    }

    if (!data.cover) {
        data.cover = await getCoverImage();
        updated = true;
    }

    if (!data.main_color) {
        data.main_color = await getMainColor(data.cover);
        updated = true;
    }

    if (updated) {
        const updatedYaml = yaml.dump(data);
        const updatedContent = content.replace(yamlSection[1], updatedYaml);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

// processFiles(POSTS_DIR);

// 在文件底部添加这段代码
hexo.on('before_generate', async () => {
    console.log('Automatically updating cover and main color...');
    await processFiles(POSTS_DIR);
    console.log('Cover and main color updated successfully!');
});
