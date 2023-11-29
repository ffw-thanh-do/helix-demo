export default function decorate(block) {
  block.innerHTML = `
  <iframe src="https://players.brightcove.net/1852113022001/JpBcT6sXX_default/index.html?videoId=6324950020112"
    allowfullscreen=""
    allow="encrypted-media"
    width="960" height="540"></iframe>
  `;
}
