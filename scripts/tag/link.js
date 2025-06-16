function link(args) {
  args = args.join(' ').split(',');
  let title = args[0];
  let sitename = args[1];
  let link = args[2];

  // 定义不同域名对应的头像URL
  const avatarUrls = {
    'github.com': 'http://img.pupper.cn/img/1750061468413.webp',
    'csdn.net': 'http://img.pupper.cn/img/1750064632094.png',
    'gitee.com': 'http://img.pupper.cn/img/1750061507144.webp',
    'zhihu.com': 'http://img.pupper.cn/img/1750061529732.webp',
    'baidu.com': 'http://img.pupper.cn/img/1750064707512.ico',
    'pupper.cn': 'http://img.pupper.cn/img/1750061770797.png',
  };

  // 定义白名单域名
  const whitelistDomains = [
    'pupper.cn'
  ];

  // 获取URL的根域名
  function getRootDomain(url) {
    try {
      // 检查URL是否有效
      if (!url || !url.match(/^https?:\/\//)) {
        return 'invalid.url';
      }
      const hostname = new URL(url).hostname;
      const domainParts = hostname.split('.').reverse();
      if (domainParts.length > 1) {
        return domainParts[1] + '.' + domainParts[0];
      }
      return hostname;
    } catch (e) {
      return 'invalid.url';
    }
  }

  // 根据URL获取对应的头像URL
  function getAvatarUrl(url) {
    const rootDomain = getRootDomain(url);
    for (const domain in avatarUrls) {
      if (domain.endsWith(rootDomain)) {
        return avatarUrls[domain];
      }
    }
    return 'https://img.pupper.cn/img/1710229767.gif';  // 默认头像URL
  }

  // 检查是否在白名单中
  function isWhitelisted(url) {
    const rootDomain = getRootDomain(url);
    for (const domain of whitelistDomains) {
      if (rootDomain.endsWith(domain)) {
        return true;
      }
    }
    return false;
  }

  // 获取对应的头像URL
  let imgUrl = getAvatarUrl(link);

  // 判断并生成提示信息
  let tipMessage = isWhitelisted(link)
    ? "✅来自本站，本站可确保其安全性，请放心点击跳转"
    : "🙄引用站外地址，不保证站点的可用性和安全性";

  return `<div class='liushen-tag-link'><a class="tag-Link" target="_blank" href="${link}">
  <div class="tag-link-tips">${tipMessage}</div>
  <div class="tag-link-bottom">
      <div class="tag-link-left" style="background-image: url(${imgUrl});"></div>
      <div class="tag-link-right">
          <div class="tag-link-title">${title}</div>
          <div class="tag-link-sitename">${sitename}</div>
      </div>
      <i class="fa-solid fa-angle-right"></i>
  </div>
  </a></div>`;
}

hexo.extend.tag.register('link', link, { ends: false });
