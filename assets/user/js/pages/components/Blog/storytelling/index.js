import 'babel-polyfill'
import CanvasMap from './canvas-map'

if (window.matchMedia("(min-width: 768px)").matches) {
  let map=CanvasMap({
    textContainer:document.querySelector('.text'),
    mapSrc:'/storytelling/map.svg',
    trailVisitedColor:'#47DBB4',
    fontPresentColor:'#5D5C56',
  }).appendTo('.container')
}

