/**
 * AnZhiYu
 * Auto-generate cover_tag for posts without one.
 * Rules:
 *   1. Extract first 4 Chinese chars from title
 *   2. Supplement from tags/categories if not enough
 *   3. Fallback to hash-selected aesthetic 4-char phrase
 */

'use strict'

const AESTHETIC_WORDS = [
  '似水流年', '浮生若夢', '靜聽風雨', '雲捲雲舒',
  '時光荏苒', '歲月如歌', '清風徐來', '花開花落',
  '春華秋實', '星月交輝', '山高水長', '煙雨朦朧',
  '晨光熹微', '暮色蒼茫', '皓月當空', '碧水藍天',
  '心如止水', '靜待花開', '隨遇而安', '不忘初心',
  '光陰似箭', '日月如梭', '海闊天空', '風輕雲淡',
  '鳥語花香', '寧靜致遠', '淡泊明志', '溫潤如玉',
  '繁花似錦', '月明星稀', '松風水月', '暗香浮動',
  '清風明月', '高山流水', '陽春白雪', '曲徑通幽',
  '花好月圓', '惠風和暢', '雲淡風輕', '秋水長天',
  '寒江獨釣', '孤帆遠影', '落日餘暉', '星河璀璨',
  '朝霞似錦', '暮煙如雨', '空谷幽蘭', '踏雪尋梅',
]

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function extractChinese(str) {
  return (str.match(/[一-鿿]/g) || [])
}

function collectNames(tagData) {
  if (!tagData) return []
  const items = tagData.data || tagData
  return Array.isArray(items) ? items.map(t => (typeof t === 'string' ? t : t.name || '')) : []
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (data.cover_tag) return data
  if (data.cover === false) return data

  const title = data.title || ''

  // 1. Extract Chinese chars from title
  const titleChars = extractChinese(title)
  if (titleChars.length >= 4) {
    data.cover_tag = titleChars.slice(0, 4).join('')
    return data
  }

  // 2. Supplement from tags and categories
  const tags = collectNames(data.tags)
  const categories = collectNames(data.categories)

  const moreChars = []
  for (const keyword of [...tags, ...categories]) {
    const chars = extractChinese(keyword)
    moreChars.push(...chars)
    if (titleChars.length + moreChars.length >= 4) break
  }

  const combined = [...titleChars, ...moreChars]
  if (combined.length >= 4) {
    data.cover_tag = combined.slice(0, 4).join('')
    return data
  }

  // 3. Fallback: deterministic selection from aesthetic word list
  const hashSource = title + (data.source || '') + (data.abbrlink || '')
  data.cover_tag = AESTHETIC_WORDS[hashCode(hashSource) % AESTHETIC_WORDS.length]

  return data
})
