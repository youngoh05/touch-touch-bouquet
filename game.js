/* =============== HTML에서 가져올 요소들 =============== */
const modal = document.getElementById("rulesModal");
const openModalBtn = document.getElementById("ruleButton");
const closeModalBtn = document.getElementById("closeModalBtn");
const errorModal = document.getElementById("errorModal");
const closeErrorModalBtn = document.getElementById("closeErrorModalBtn");
const flowerCountDisplay = document.getElementById("flowerCountDisplay");
const orderModal = document.getElementById("orderModal");
const compareModal = document.getElementById("compareModal");
const resultModal = document.getElementById("resultModal");


/* =============== 기본 설정 (색상, 이미지, 주문 정보) =============== */
// 영어 색 이름을 한글로 바꿔주는 사전
const colorNames = {
    blue: '파란색',
    pink: '분홍색',
    red: '빨간색',
    yellow: '노란색'
};

// 각 색깔별 꽃 이미지 파일 목록
const flowerImages = {
    blue: ['blue1.png', 'blue2.png', 'blue3.png', 'blue4.png', 'blue5.png'],
    red: ['red1.png', 'red2.png', 'red3.png', 'red4.png', 'red5.png'],
    yellow: ['yellow1.png', 'yellow2.png', 'yellow3.png', 'yellow4.png', 'yellow5.png'],
    pink: ['pink1.png', 'pink2.png', 'pink3.png', 'pink4.png', 'pink5.png']
};

// 현재 주문 정보와 진행 상태를 저장하는 곳
let orderData = {
    flower1: '',              // 첫 번째 주문한 꽃 색깔
    flower2: '',              // 두 번째 주문한 꽃 색깔
    flower1Count: 0,          // 첫 번째 꽃 개수
    flower2Count: 0,          // 두 번째 꽃 개수
    flower1Clicked: 0,        // 첫 번째 꽃을 클릭한 개수
    flower2Clicked: 0,        // 두 번째 꽃을 클릭한 개수
    additionalFlowerColor: '', // 게임 중 추가로 나올 꽃 색깔
    additionalFlowerCount: 0   // 추가로 나올 꽃 개수
};


/* =============== 자주 쓰는 도우미 함수 =============== */
// 모달(팝업창)을 보여주는 함수
function showModal(element) {
    element.classList.remove("hidden");
    element.style.display = "flex";
}

// 모달을 숨기는 함수
function hideModal(element) {
    element.classList.add("hidden");
    element.style.display = "none";
}

// 화면에 있는 두 사각형이 겹쳤는지 확인하는 함수
function isCollision(rect1, rect2, minDistance) {
    const xOverlap = rect1.right + minDistance > rect2.left && rect1.left - minDistance < rect2.right;
    const yOverlap = rect1.bottom + minDistance > rect2.top && rect1.top - minDistance < rect2.bottom;
    return xOverlap && yOverlap;
}

// 여러 개의 HTML 요소를 한 번에 숨기거나 보이게 하는 함수
function toggleElements(ids, show) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (show) {
            el.classList.remove("hidden");
            el.style.display = "";
        } else {
            el.classList.add("hidden");
            el.style.display = "none";
        }
    });
}


/* =============== 게임 방법 모달창 제어 =============== */

// "게임 방법 보기" 버튼을 눌렀을 때
openModalBtn.addEventListener("click", () => 
    showModal(modal)
);

// "닫기" 버튼을 눌렀을 때
closeModalBtn.addEventListener("click", () => {
    hideModal(modal);  

    // TTS 재생 중이면 멈추기
    if (isPlaying && ttsAudio) {
        ttsAudio.pause();
        ttsAudio.currentTime = 0;
        isPlaying = false;
    }

    // 배경음악 볼륨 복원
    if (bgGainNode) bgGainNode.gain.value = 1.0;
});

// 모달 밖(회색 배경) 클릭하면 닫기
window.addEventListener("click", (event) => {
    if (event.target === modal) hideModal(modal);
});


/* =============== 게임 방법 TTS + 배경음악 볼륨 제어 (iOS 대응) =============== */
// Web Audio API 생성
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bgAudio = document.getElementById("backgroundAudio");
let bgSource = null;
let bgGainNode = null;

// 배경음악 GainNode 준비
function setupBackgroundAudio() {
    if (!bgAudio) return;

    if (bgSource) return; // 중복 연결 방지

    bgSource = audioContext.createMediaElementSource(bgAudio);
    bgGainNode = audioContext.createGain();
    bgGainNode.gain.value = 1.0; // 기본 볼륨

    bgSource.connect(bgGainNode).connect(audioContext.destination);
}

/* iOS는 사용자 터치 후 AudioContext 활성화됨 */
document.addEventListener("click", () => {
    if (audioContext.state === "suspended") {
        audioContext.resume().then(() => setupBackgroundAudio());
    } else {
        setupBackgroundAudio();
    }
}, { once: true });


// TTS 재생 버튼
const soundBtn = document.getElementById('soundBtn');
let ttsAudio = null;
let isPlaying = false;

if (soundBtn) {
    soundBtn.addEventListener('click', () => {

        if (isPlaying && ttsAudio) {
            // 이미 재생 중이면 정지
            ttsAudio.pause();
            ttsAudio.currentTime = 0;
            isPlaying = false;

            // 배경음악 볼륨 복원
            if (bgGainNode) bgGainNode.gain.value = 1.0;
            return;
        }

        // 새로운 TTS 재생
        ttsAudio = new Audio('assets/audio/tts.mp3');

        // 배경음악 볼륨 낮추기
        if (bgGainNode) bgGainNode.gain.value = 0.2;

        ttsAudio.play();
        isPlaying = true;

        // TTS 종료 → 배경음악 복원
        ttsAudio.addEventListener('ended', () => {
            if (bgGainNode) bgGainNode.gain.value = 1.0;
            isPlaying = false;
        });
    });
}



/* ================================ 잘못 클릭했을 때의 에러 모달 ================================ */
// 에러 모달의 닫기 버튼이 존재할 경우
if (closeErrorModalBtn) {
    // 닫기 버튼 클릭 시 모달 숨기기
    closeErrorModalBtn.addEventListener("click", () => hideModal(errorModal));
}

// 에러 모달 바깥(회색 배경)을 클릭했을 때도 모달 닫기
window.addEventListener("click", (event) => {
    if (event.target === errorModal) hideModal(errorModal);  // 클릭한 대상이 모달 배경이면 숨김
});


/* =============== 게임 시작하기 =============== */
// "게임 시작하기" 버튼 클릭 이벤트
document.getElementById("startButton").addEventListener("click", () => {
    
    // 현재 화면의 가로 길이 가져오기
    const screenWidth = window.innerWidth;
    
    // 배경 요소 선택
    const background = document.querySelector(".background");

    // 화면 크기에 따라 배경 이미지 다르게 설정
    // PC 화면이면 GrassPc.png, 태블릿/모바일이면 GrassPad.png
    background.style.backgroundImage = screenWidth >= 1024
        ? "url('assets/image/background/GrassPc.png')"
        : "url('assets/image/background/GrassPad.png')";

    // 메인 화면의 요소들 숨기기 (게임 화면으로 전환)
    toggleElements(["mainScreen", "mainTitle", "flowerShopImage", "ruleButton", "startButton"], false);

    // 꽃 개수 표시 요소가 있으면 숨김
    if (flowerCountDisplay) flowerCountDisplay.style.display = "none";

    // 랜덤 주문 생성 함수 호출 (게임 시작 시 주문 등장)
    showRandomOrder();
});



/* =============== 주문 만들기 + 주문 보여주기 =============== */
// 랜덤 주문 생성 및 모달에 표시하는 함수
function showRandomOrder() {
    // 색상 이름 목록 가져오기 (colorNames 객체의 키)
    const colors = Object.keys(colorNames);
    // 주문자 이미지 후보
    const people = ['boy.png', 'girl.png', 'man.png', 'woman.png'];

    // 첫 번째 꽃 색상 랜덤 선택
    let flower1 = colors[Math.floor(Math.random() * colors.length)];

    // 두 번째 꽃 색상 랜덤 선택 (첫 번째와 겹치지 않게)
    let flower2;
    do { 
        flower2 = colors[Math.floor(Math.random() * colors.length)]; 
    } while (flower2 === flower1);

    // 첫 번째 꽃 개수 랜덤 선택 (1~10개)
    let count1 = Math.floor(Math.random() * 10) + 1;

    // 두 번째 꽃 개수 랜덤 선택 (첫 번째와 겹치지 않게)
    let count2;
    do { 
        count2 = Math.floor(Math.random() * 10) + 1; 
    } while (count2 === count1);

    // 주문자 이미지와 주문 내용 요소 가져오기
    const personImg = document.getElementById("personImg");
    const orderText = document.getElementById("orderText");

    // 주문 내용을 모달에 표시
    if (orderText) {
        orderText.innerHTML = `
            <span class="${flower1}">${colorNames[flower1]} 꽃 ${count1}송이</span>와 
            <span class="${flower2}">${colorNames[flower2]} 꽃 ${count2}송이</span>를 주세요.
        `;
    }

    // 주문자 이미지를 랜덤으로 선택
    if (personImg) {
        personImg.src = `assets/image/people/${people[Math.floor(Math.random() * people.length)]}`;
    }

    // 주문 정보를 전역 객체에 저장 (게임 진행 시 사용)
    orderData = {
        flower1,                 // 첫 번째 꽃 색상
        flower2,                 // 두 번째 꽃 색상
        flower1Count: count1,    // 첫 번째 꽃 개수
        flower2Count: count2,    // 두 번째 꽃 개수
        flower1Clicked: 0,       // 첫 번째 꽃 클릭 횟수
        flower2Clicked: 0,       // 두 번째 꽃 클릭 횟수
        additionalFlowerColor: '', // 추가 꽃 색상 (없으면 빈 문자열)
        additionalFlowerCount: 0   // 추가 꽃 개수
    };

    // 주문 모달 표시
    showModal(orderModal);
}

// "주문 확인" 버튼 클릭 이벤트 → 꽃 배치 시작
document.getElementById("confirmOrderBtn").addEventListener("click", () => {
    // 꽃 개수 표시 영역 보이게 하기
    if (flowerCountDisplay) flowerCountDisplay.style.display = "block";

    // 주문 모달 닫기
    hideModal(orderModal);

    // 꽃 배치 함수 호출 (첫 번째, 두 번째 꽃과 개수 전달)
    placeFlowers(orderData.flower1, orderData.flower1Count, orderData.flower2, orderData.flower2Count);
});


/* =============== 꽃 배치하기 =============== */
// 주문에 맞춰 화면에 꽃을 배치하는 함수
function placeFlowers(flowerColor1, flowerCount1, flowerColor2, flowerCount2) {
    removeAllFlowers();  // 기존에 화면에 있는 모든 꽃 삭제

    // 첫 번째와 두 번째 주문 꽃 이미지 목록 가져오기
    const flowerImages1 = flowerImages[flowerColor1];
    const flowerImages2 = flowerImages[flowerColor2];

    // 주문에 없는 색 중에서 방해 꽃 색상을 랜덤 선택
    const otherColors = Object.keys(colorNames).filter(c => c !== flowerColor1 && c !== flowerColor2);
    const extraColor = otherColors[Math.floor(Math.random() * otherColors.length)];

    // 방해 꽃 이미지 목록과 개수 결정 (1~5개 랜덤)
    const extraImages = flowerImages[extraColor];
    const extraCount = Math.floor(Math.random() * 5) + 1;

    // 화면에 꽃 하나를 만들고 랜덤 위치에 배치하는 함수
    function makeFlower(color, list) {
        const img = document.createElement('img');  // <img> 요소 생성
        img.src = `assets/image/flower/${color}/${list[Math.floor(Math.random() * list.length)]}`;  // 랜덤 이미지 선택
        img.alt = `${color} flower`;  // 접근성을 위한 alt 속성
        img.classList.add('flower');  // CSS 클래스 추가
        setRandomPosition(img);  // 화면 내 랜덤 위치 설정
        img.onclick = (event) => handleFlowerClick(event, color);  // 클릭 이벤트 연결
        document.body.appendChild(img);  // 화면에 추가
    }

    // 첫 번째 꽃 배치
    for (let i = 0; i < flowerCount1; i++) makeFlower(flowerColor1, flowerImages1);
    // 두 번째 꽃 배치
    for (let i = 0; i < flowerCount2; i++) makeFlower(flowerColor2, flowerImages2);
    // 방해 꽃 배치
    for (let i = 0; i < extraCount; i++) makeFlower(extraColor, extraImages);

    // 주문 데이터에 방해 꽃 정보 저장
    orderData.additionalFlowerColor = extraColor;
    orderData.additionalFlowerCount = extraCount;

    // 상단에 현재 꽃 배치 상태 표시
    updateFlowerCountDisplay();
}



/* =============== 꽃 클릭 시 처리 =============== */
// 꽃을 클릭했을 때 호출되는 함수
function handleFlowerClick(event, flowerColor) {
    // 주문한 첫 번째 꽃을 클릭했을 때
    if (flowerColor === orderData.flower1 && orderData.flower1Clicked < orderData.flower1Count) {
        orderData.flower1Clicked++;  // 클릭 횟수 증가
    }
    // 주문한 두 번째 꽃을 클릭했을 때
    else if (flowerColor === orderData.flower2 && orderData.flower2Clicked < orderData.flower2Count) {
        orderData.flower2Clicked++;  // 클릭 횟수 증가
    }
    // 주문하지 않은 꽃(방해 꽃 등)을 클릭했을 때
    else {
        showErrorModal();             // 에러 모달 표시
        resetAndRegenerateFlowers();  // 꽃 다시 배치
        return;                       // 함수 종료
    }

    // 클릭한 꽃 화면에서 제거
    event.target.remove();

    // 상단 꽃 개수 표시 업데이트
    updateFlowerCountDisplay();

    // 주문한 모든 꽃을 다 클릭했다면
    if (orderData.flower1Clicked === orderData.flower1Count && orderData.flower2Clicked === orderData.flower2Count) {
        showCompareModal();  // 비교/문제 모달로 이동
    }
}


/* =============== 꽃 개수 화면에 표시 =============== */
// 상단에 주문한 꽃과 현재 클릭한 꽃 개수를 업데이트하는 함수
function updateFlowerCountDisplay() {
    if (!flowerCountDisplay) return;  // flowerCountDisplay 요소가 없으면 함수 종료

    // HTML 내용 업데이트
    // 첫 번째 꽃: 이름, 현재 클릭한 개수 / 주문 개수
    // 두 번째 꽃: 이름, 현재 클릭한 개수 / 주문 개수
    flowerCountDisplay.innerHTML =
        `<div class="count-item ${orderData.flower1}">
            <span>${colorNames[orderData.flower1]} 꽃: ${orderData.flower1Clicked} / ${orderData.flower1Count}</span>
        </div>` +
        `<div class="count-item ${orderData.flower2}">
            <span>${colorNames[orderData.flower2]} 꽃: ${orderData.flower2Clicked} / ${orderData.flower2Count}</span>
        </div>`;
}



/* =============== 꽃 위치 배치 + 다시 생성 =============== */
// 꽃을 화면에 랜덤하게 배치하되 서로 겹치지 않도록 하는 함수
function setRandomPosition(flowerElement) {
    const maxX = window.innerWidth - 50;   // 화면 가로 범위 (꽃 크기 고려)
    const maxY = window.innerHeight - 50;  // 화면 세로 범위 (꽃 크기 고려)

    let posX, posY, valid = false, attempts = 0;

    // 최대 100번 시도하며 겹치지 않는 위치 찾기
    while (!valid && attempts < 100) {
        posX = Math.random() * maxX;  // 랜덤 X 좌표
        posY = Math.random() * maxY;  // 랜덤 Y 좌표
        valid = true;  // 초기값은 유효 위치로 설정

        // 이미 배치된 꽃들과 겹치는지 확인
        document.querySelectorAll('.flower').forEach(flower => {
            const r1 = flower.getBoundingClientRect();  // 기존 꽃 위치 정보
            const r2 = { left: posX, top: posY, right: posX + 50, bottom: posY + 50 };  // 새 꽃 위치 정보
            if (isCollision(r1, r2, 60)) valid = false;  // 겹치면 위치 다시 시도
        });

        attempts++;  // 시도 횟수 증가
    }

    // 유효한 위치를 찾으면 꽃 요소에 위치 적용
    flowerElement.style.position = 'absolute';
    flowerElement.style.zIndex = '10';  // 다른 요소 위에 표시
    flowerElement.style.left = `${posX}px`;
    flowerElement.style.top = `${posY}px`;
}

// 화면에 있는 모든 꽃 제거
function removeAllFlowers() {
    document.querySelectorAll('.flower').forEach(flower => flower.remove());
}

// 잘못 클릭했을 때 꽃 상태 초기화하고 다시 배치
function resetAndRegenerateFlowers() {
    orderData.flower1Clicked = 0;  // 첫 번째 꽃 클릭 카운트 초기화
    orderData.flower2Clicked = 0;  // 두 번째 꽃 클릭 카운트 초기화
    // 기존 주문대로 꽃 다시 배치
    placeFlowers(orderData.flower1, orderData.flower1Count, orderData.flower2, orderData.flower2Count);
}


/* =============== 에러 모달 =============== */
// 에러 모달을 화면에 보여주는 함수
function showErrorModal() {
    showModal(errorModal);  // 미리 정의된 showModal 함수 사용
}

// 에러 모달의 닫기 버튼 클릭 시 모달 숨기기
document.querySelector('#errorModal .close-btn')?.addEventListener('click', () => {
    hideModal(errorModal);
});


/* =============== 비교 모달 (어떤 꽃이 더 많을까?) =============== */
// 비교 모달을 보여주고 버튼 설정
function showCompareModal() {
    removeAllFlowers();  // 화면에 남아 있는 꽃 제거

    const btn1 = document.getElementById("compareBtn1");  // 첫 번째 버튼
    const btn2 = document.getElementById("compareBtn2");  // 두 번째 버튼

    // 버튼 텍스트를 꽃 색 이름으로 설정
    btn1.textContent = `${colorNames[orderData.flower1]}`;
    btn2.textContent = `${colorNames[orderData.flower2]}`;

    // 버튼 배경색을 꽃 색과 매칭
    const colorMap = {
        red: '#ff1900',
        pink: '#ff76b4',
        yellow: '#ffcc00',
        blue: '#0099ff'
    };

    btn1.style.backgroundColor = colorMap[orderData.flower1];
    btn2.style.backgroundColor = colorMap[orderData.flower2];
    btn1.style.color = 'white';  // 글자 색 흰색
    btn2.style.color = 'white';

    // 클릭 시 정답 확인 함수 연결
    btn1.onclick = () => checkCompareAnswer(orderData.flower1);
    btn2.onclick = () => checkCompareAnswer(orderData.flower2);

    showModal(compareModal);  // 비교 모달 화면에 표시
}

// 사용자가 선택한 색이 더 많은 꽃인지 확인
function checkCompareAnswer(selectedColor) {
    // 꽃 개수가 더 많은 색 결정
    const correctColor = orderData.flower1Count > orderData.flower2Count ? orderData.flower1 : orderData.flower2;
    hideModal(compareModal);  // 비교 모달 숨기기

    // 맞으면 결과 모달, 틀리면 재시도 메시지
    if (selectedColor === correctColor) showResultModal();
    else showRetryMessage();
}

// 오답 시 다시 시도 버튼 클릭 처리
document.getElementById("retryConfirmBtn").addEventListener("click", () => {
    const retryModal = document.getElementById("retryModal");
    retryModal.classList.add("hidden");  // 모달 숨기기
    retryModal.style.display = "none"; 
    showCompareModal();  // 비교 모달 다시 표시
});

// 오답 시 재시도 모달 보여주기
function showRetryMessage() {
    const retryModal = document.getElementById("retryModal");
    if (retryModal) {
        retryModal.classList.remove("hidden");  // 숨김 해제
        retryModal.style.display = "flex";  // 화면에 표시
    }
}


/* =============== 정답 모달 (꽃다발 보여주기) =============== */
// 게임 정답 모달을 표시하고, 색상에 맞는 꽃다발 이미지를 보여주는 함수
function showResultModal() {
    removeAllFlowers();  // 이전 꽃들을 화면에서 제거

    // 색상별 꽃다발 이미지 매핑
    const bouquetImages = {
        redyellow: "redyellow.png",
        redpink: "redpink.png",
        redblue: "redblue.png",
        pinkred: "pinkred.png",
        pinkyellow: "pinkyellow.png",
        pinkblue: "pinkblue.png",
        yellowred: "yellowred.png",
        yellowpink: "yellowpink.png",
        yellowblue: "yellowblue.png",
        bluered: "bluered.png",
        bluepink: "bluepink.png",
        blueyellow: "blueyellow.png"
    };

    // 'orderData'에서 두 꽃의 색상과 개수를 가져옴
    const { flower1, flower2, flower1Count, flower2Count } = orderData;

    // 더 많은 꽃과 적은 꽃 색상을 결정
    const moreFlowersColor = flower1Count >= flower2Count ? flower1 : flower2;
    const lessFlowersColor = flower1Count >= flower2Count ? flower2 : flower1;
    
    // 색상을 합쳐서 꽃다발 이미지 이름 결정 (예: 'redyellow')
    const bouquetImageName = `${moreFlowersColor}${lessFlowersColor}`;
    // 이미지 요소 가져오기
    const bouquetImgElement = document.getElementById("bouquetImage");

    // 해당 이미지가 있으면 변경
    if (bouquetImgElement && bouquetImages[bouquetImageName]) {
        bouquetImgElement.src = `assets/image/bouquet/${bouquetImages[bouquetImageName]}`;
    }

    // 정답 모달을 화면에 표시
    showModal(resultModal);
}


// “게임 끝내기” 버튼 눌렀을 때 처리
const closeResultBtn = document.getElementById("closeResultModalBtn");
if (closeResultBtn) {
    closeResultBtn.addEventListener("click", () => {
        hideModal(resultModal);  // 정답 모달 숨기기
        removeAllFlowers();  // 화면에 남아 있는 꽃 제거
        toggleElements(["mainScreen", "mainTitle", "flowerShopImage", "ruleButton", "startButton"], true);  // 메인 화면 요소 다시 표시

        const background = document.querySelector(".background");
        if (background) background.style.backgroundImage = "";  // 배경 이미지 초기화

        if (flowerCountDisplay) flowerCountDisplay.style.display = "none";  // 꽃 개수 표시 숨기기
    });
}


/* =============== 배경 음악 자동재생 처리 =============== */
// 페이지가 모두 로드되었을 때 실행
window.addEventListener('load', () => {
    const audio = document.getElementById('backgroundAudio');  // 배경 음악 오디오 요소 가져오기
    audio.volume = 0.5;  // 볼륨 50%로 설정

    // 오디오 재생 시도
    audio.play().catch(() => {
        // 자동 재생이 브라우저 정책으로 막혔을 경우
        // 사용자가 클릭하면 음악 재생
        document.addEventListener('click', function playMusicOnce() {
            audio.play();  // 클릭 시 음악 재생
            document.removeEventListener('click', playMusicOnce);  // 한 번만 재생하도록 이벤트 제거
        });
    });
});