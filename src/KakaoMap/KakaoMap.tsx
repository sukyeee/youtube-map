import React, { useState, useEffect, useCallback } from 'react';
import styles from './KakaoMap.module.scss'
import { restaurantsInfo } from '../api/restuarants'
import { async } from '@firebase/util';
import { defaultMaxListeners } from 'events';
import Icon from '/Users/sk/kakao_map/src/assets/circle-dot-solid.svg'

declare global {
    interface Window {
        kakao: any
    }
}

type positionType = {
    lat: number;
    lon: number
}

type markerType = {
    title: string,
    latlng: object,
    // url: string
}

function KakaoMap(props:any) {
    const [position, setPosition] = useState({ lat: 0, lon: 0 })
    const [markerData, setMarkerData] = useState<markerType[]>([])
    const [addressInfo, setAddressInfo] = useState<string[]>([])
    const [address, setAddress] = useState<string[]>([])

    function createMap(position: positionType) {

        let container = document.getElementById('map')
        let options: object = {
            center: new window.kakao.maps.LatLng(position.lat, position.lon),
            level: 12
        }
        let map = new window.kakao.maps.Map(container, options)

        
        setMarker(map)
        console.log(markerData)
    }
    
    function setMarker(map:object){

        // 텍스트 주소 -> 위치 주소로 변경
        getCommentInfo();

         // restaurant 마커 정보 추가
         let positions = markerData;
         
         positions.map(data => {
              // 마커 이미지의 이미지 주소
        
            let imageSrc = Icon;

            // 마커 이미지의 이미지 크기
            let imageSize = new window.kakao.maps.Size(22, 22); 

            // 마커 이미지를 생성합니다    
            let markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize,   )  
            
            // { offset: new window.kakao.maps.Point(24, 24) }// 마커이미지의 옵션입니다. 마커의 좌표와 일치시킬 이미지 안에서의 좌표를 설정합니다.);) 
            // 마커를 생성합니다

            
            let marker = new window.kakao.maps.Marker({
                map: map,
                position: data.latlng,
                title: data.title, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
                image: markerImage // 마커 이미지 
            });

            // 커스텀 오버레이에 표출될 내용으로 HTML 문자열이나 document element가 가능
            let content = `<div id="customoverlay" class=${styles['customoverlay']} >` +
            `  <a href="#" target="_blank">` +
            `    <span class=${styles['title']}>${data.title}</span>` +
            '  </a>' +
            '</div>';

            // 커스텀 오버레이가 표시될 위치
            let position = new window.kakao.maps.LatLng(data.latlng);  

            // 커스텀 오버레이를 생성
            let customOverlay = new window.kakao.maps.CustomOverlay({
                map: map,
                position: data.latlng,
                content: content,
                yAnchor: 1,
            });


        })
    }

    function getCurrentPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                let lat = position.coords.latitude;
                let lon = position.coords.longitude;
                setPosition({ lat: lat, lon: lon })
            })
        }
    }
   
    // Comment에서 댓글 텍스트만 걸러내기
    const getCommentInfo = () => {
        
        let comment = props.comment;
        // console.log('KakaoMap Comment' , comment)

        for(let i in comment){
            if(comment[i] !== null && comment[i] !== undefined){
                setAddressInfo(addressInfo => [...addressInfo, comment[i].snippet.topLevelComment.snippet.textOriginal]);
            }
        }
        console.log(addressInfo)
    
        // 댓글 중에서 "주소" 텍스트 만 걸러내기
        getAddressInfo();
        console.log(address)
        
        // "주소" 를 "위치" 데이터로 변환
        transAddressInfo();
     
    }
    // 댓글 중에서 "주소" 텍스트 만 걸러내기
    const getAddressInfo = () => {

        addressInfo.map((value, index) => {
            let addressIndex = value.indexOf('주소');
            let numIndex = value.indexOf('전화번호');
            if(value.indexOf('매장번호') !== -1 && value.indexOf('매장번호') < numIndex) numIndex = numIndex = value.indexOf('매장번호');
            if(value.indexOf('영업시간') !== -1 && value.indexOf('영업시간') < numIndex) numIndex = numIndex = value.indexOf('영업시간');
            
            if(addressIndex !== -1 && numIndex !== -1){
            
                console.log(value.substring(addressIndex+3, numIndex));
                setAddress(address => [...address, value.substring(addressIndex+3, numIndex)])
            }
        })
    }

      // "주소" 를 "위치" 데이터로 변환
      const transAddressInfo = () => {
        address.map((value, index) => {
        
            // console.log(value)
            let geocoder = new window.kakao.maps.services.Geocoder();

            geocoder.addressSearch(value, function(result:any, status:any) {
                
                if(status === window.kakao.maps.services.Status.OK) {
                    let coords = new window.kakao.maps.LatLng(result[0].y, result[0].x)
                      
                    let titleIndexEnd = value.lastIndexOf("\n");
                    if(value.substring(titleIndexEnd-1, titleIndexEnd) === ')') titleIndexEnd = titleIndexEnd - 1
                    let titleIndexStart = value.lastIndexOf(" ", titleIndexEnd)+1
                    console.log(titleIndexStart, titleIndexEnd)
                    let title = value.substring(titleIndexStart, titleIndexEnd);

                   setMarkerData(markerData => [...markerData, {title:title, latlng:coords}])
                }
            })
        })
    }


    useEffect(() => {
        // 초기 위치 설정
        getCurrentPosition();
    }, [])

    useEffect(() => {
        createMap(position)
    }, [position])


    return (
        <>

            <div id="map" className={styles['map']}>
                <button className={styles['location']} onClick={getCurrentPosition}></button>
            </div>

        </>

    )
}


export default KakaoMap;