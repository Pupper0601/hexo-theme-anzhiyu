"use strict";

function postBtns(args, content) {
  return `<div class="btns ${args.join(" ")}">
            ${content}
          </div>`;
}

function postCell(args, content) {
  args = args.join(" ").split(",");
  let text = args[0] || "";
  let url = args[1] || "";
  text = text.trim();
  url = url.trim();
  if (url.length > 0) {
    url = "href='" + url + "'";
  }
  let icon = "";
  let img = "https://npm.elemecdn.com/hexo-butterfly-tag-plugins-plus/lib/assets/default.svg";
  if (args.length > 2) {
    // if (args[2].indexOf(" anzhiyufont") > -1) {
    if (args[2].indexOf("http") > -1) {
      img = args[2].trim();
    } else {
      icon = args[2].trim();
    }
  }
  if (icon.length > 0) {
    return `<a class="button no-text-decoration" ${url} title='${text}'><i class='${icon}'></i>${text}</a>`;
  } else {
    return `<a class="button no-text-decoration" ${url} title='${text}'><img src='${img}'>${text}</a>`;
  }
}

hexo.extend.tag.register("btns", postBtns, { ends: true });
hexo.extend.tag.register("cell", postCell);
