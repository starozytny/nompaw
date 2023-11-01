import 'babel-polyfill'
import CanvasMap from './canvas-map'

if (window.matchMedia("(min-width: 768px)").matches) {
  let mapSrc = document.querySelector('#mapSrc');
  if(mapSrc){
    let map = CanvasMap({
      textContainer:document.querySelector('.text'),
      mapSrc:'/storytelling/' + mapSrc.dataset.map,
      trailVisitedColor:'#47DBB4',
      fontPresentColor:'#5D5C56',
    }).appendTo('.container')
  }
}else{
  let article = document.querySelector('#article');
  let loader = document.querySelector('#article-loader');
  article.style.opacity = "1";
  loader.style.display = "none";
}

