// chatbot.js 파일 내용 

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function () {
	// 요소 선택
	const toggleBtn = document.getElementById('chatbotToggleBtn');
	const closeBtn = document.getElementById('chatbotCloseBtn');
	const chatbotWindow = document.getElementById('chatbotWindow');
	const sendBtn = document.getElementById('chatbotSendBtn');
	const chatbotInput = document.getElementById('chatbotInput');
	const chatbotMessages = document.getElementById('chatbotMessages');
	const quickBtns = document.querySelectorAll('.quick-btn');

	// 대화 기록 저장소 (채팅창이 열려있는 동안만 유지)
	let conversationMemory = [];

	// 이미지 URL 설정
	const aiAvatarUrl = 'AI_assistant.png'; // AI 아이콘
	const userAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/847/847969.png'; // 사용자 아이콘

	if (window.innerWidth <= 600) {
		chatbotWindow.classList.add('initial-position');
	}

	// 챗봇 토글 버튼 클릭 이벤트
	toggleBtn.addEventListener('click', function () {
		if (chatbotWindow.style.display === 'flex') {
			chatbotWindow.style.display = 'none';
		} else {
			chatbotWindow.style.display = 'flex';
			// 챗봇 열릴 때 입력창에 포커스
			if (window.innerWidth > 600) {
				chatbotInput.focus();
			}
		}
	});

	document.addEventListener('click', function (event) {
		// 모바일 환경에서만 작동하도록 조건 추가
		if (window.innerWidth <= 600) {
			if (document.activeElement === chatbotInput &&
				!chatbotInput.contains(event.target) && // 클릭 대상이 입력창 자체가 아니거나 그 안에 포함되지 않는다면
				!chatbotWindow.contains(event.target) && // 클릭 대상이 챗봇 창 전체 안에 포함되지 않는다면 (완전 외부 클릭)
				chatbotWindow.style.display === 'flex' // 챗봇 창이 현재 열려있는 상태여야 함
			) {
				chatbotInput.blur();
			}
		}
	});

	// 챗봇 닫기 버튼 클릭 이벤트
	closeBtn.addEventListener('click', function () {
		chatbotWindow.style.display = 'none';
	});

	// 빠른 질문 버튼 클릭 이벤트
	quickBtns.forEach(btn => {
		btn.addEventListener('click', function () {
			const question = this.getAttribute('data-question');
			chatbotInput.value = question;
			sendMessageToBackend();
		});
	});

	// 전송 버튼 클릭 이벤트
	sendBtn.addEventListener('click', sendMessageToBackend);

	// 엔터 키로 메시지 전송
	chatbotInput.addEventListener('keypress', function (e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessageToBackend();
		}
	});

	// 모바일 키보드 열릴 때 레이아웃 조정
	// JavaScript 수정본 (CSS와 완벽 호환)
	let originalChatbotStyle = {};

	// 제가 제안한 개선된 버전 핵심 부분
	chatbotInput.addEventListener('focus', function () {
		if (window.innerWidth <= 600) {
			// 원래 스타일 저장
			const computedStyle = window.getComputedStyle(chatbotWindow);

			originalChatbotStyle = {
				bottom: computedStyle.bottom,
				height: computedStyle.height,
				position: computedStyle.position
			};

			// 키보드 높이 동적 계산
			const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
			const estimatedKeyboardHeight = isIOS ? 300 : 250;
			const safeAreaBottom = 0;

			// 챗봇 창 조정
			chatbotWindow.style.position = 'fixed';
			//chatbotWindow.style.bottom = `${estimatedKeyboardHeight + safeAreaBottom}px`;
			//chatbotWindow.style.height = `calc(100dvh - ${estimatedKeyboardHeight + safeAreaBottom}px)`;

			// 부드러운 전환
			//chatbotWindow.style.transition = 'bottom 0.3s ease, height 0.3s ease';
		}
	});

	chatbotInput.addEventListener('blur', function () {
		if (window.innerWidth <= 600) {
			/*setTimeout(() => {
				chatbotWindow.style.removeProperty('bottom');
				chatbotWindow.style.removeProperty('height');
				chatbotWindow.style.removeProperty('position'); // 필요하다면 이것도 제거
				chatbotWindow.style.removeProperty('transition'); // focus에서 설정했던 transition도 제거
			}, 200);*/
		}
	});


	// 창 크기 변경 시 처리
	window.addEventListener('resize', function () {
		if (window.innerWidth > 600) {
			// 데스크톱으로 돌아가면 모든 스타일 초기화
			chatbotWindow.style.cssText = '';
			chatbotWindow.classList.remove('initial-position');
		} else {
			// 모바일로 돌아가면 초기 위치 클래스 추가
			if (!chatbotWindow.classList.contains('initial-position')) {
				chatbotWindow.classList.add('initial-position');
			}
		}
	});

	function adjustScrollOnKeyboard() {
		if (chatbotMessages) {
			chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
		}
	}



	// 현재 시간 포맷팅 함수
	function getCurrentTime() {
		const now = new Date();
		return now.toLocaleTimeString('ko-KR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	// 메시지 추가 함수 (아바타 포함)
	function addMessage(text, sender) {
		const messageContainer = document.createElement('div');
		messageContainer.className = `message-container ${sender}-container`;

		// AI 메시지일 때 왼쪽에 아바타
		if (sender === 'bot') {
			const avatarContainer = document.createElement('div');
			avatarContainer.className = 'avatar-container';

			const avatarImg = document.createElement('img');
			avatarImg.src = aiAvatarUrl;
			avatarImg.alt = 'AI Assistant';
			avatarImg.className = 'avatar-img';

			avatarContainer.appendChild(avatarImg);
			messageContainer.appendChild(avatarContainer);
		}

		// 메시지 콘텐츠 컨테이너
		const messageContent = document.createElement('div');
		messageContent.className = 'message-content-wrapper';

		// 메시지 말풍선
		const messageDiv = document.createElement('div');
		messageDiv.className = `chatbot-message ${sender}-message`;
		messageDiv.innerHTML = formatMarkdown(text);

		messageContent.appendChild(messageDiv);

		// 시간 표시
		const timeStamp = document.createElement('div');
		timeStamp.className = 'message-time';
		timeStamp.textContent = getCurrentTime();
		messageContent.appendChild(timeStamp);

		messageContainer.appendChild(messageContent);

		// 사용자 메시지일 때 오른쪽에 아바타
		if (sender === 'user') {
			const userAvatarContainer = document.createElement('div');
			userAvatarContainer.className = 'avatar-container user-avatar';

			const userAvatarImg = document.createElement('img');
			userAvatarImg.src = userAvatarUrl;
			userAvatarImg.alt = 'You';
			userAvatarImg.className = 'avatar-img';

			userAvatarContainer.appendChild(userAvatarImg);
			messageContainer.appendChild(userAvatarContainer);
		}

		chatbotMessages.appendChild(messageContainer);

		// 대화 기록 저장
		conversationMemory.push({
			role: sender === 'user' ? 'user' : 'assistant',
			content: text,
			timestamp: new Date().toISOString()
		});

		// 기록이 너무 길어지면 오래된 것 삭제
		if (conversationMemory.length > 15) {
			conversationMemory = conversationMemory.slice(-15);
		}

		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	// 마크다운을 HTML로 변환하는 함수
	function formatMarkdown(text) {
		if (!text) return '';

		// **bold** -> <strong>bold</strong>
		let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

		// *italic* -> <em>italic</em>
		formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

		// ## Heading -> <h3>Heading</h3>
		formatted = formatted.replace(/## (.*?)(\n|$)/g, '<h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">$1</h3>');

		// # Heading -> <h2>Heading</h2>
		formatted = formatted.replace(/# (.*?)(\n|$)/g, '<h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">$1</h2>');

		// - list item -> <li>list item</li>
		formatted = formatted.replace(/^- (.*?)(\n|$)/gm, '<li style="margin-left: 15px; margin-bottom: 4px;">$1</li>');

		// 숫자. list item -> <li>list item</li>
		formatted = formatted.replace(/^(\d+)\. (.*?)(\n|$)/gm, '<li style="margin-left: 15px; margin-bottom: 4px;">$2</li>');

		// 줄바꿈 처리
		formatted = formatted.replace(/\n\n/g, '<br><br>');
		formatted = formatted.replace(/\n/g, '<br>');

		// <li> 태그가 있으면 <ul>로 감싸기
		if (formatted.includes('<li>')) {
			formatted = '<ul style="margin: 8px 0; padding-left: 20px;">' + formatted + '</ul>';
		}

		return formatted;
	}


	// 메시지 전송 함수
	async function sendMessageToBackend() {
		const message = chatbotInput.value.trim();
		if (message === '') return;

		addMessage(message, 'user');
		chatbotInput.value = '';

		// 로딩 표시 추가 (아바타 포함)
		const loadingContainer = document.createElement('div');
		loadingContainer.className = 'message-container bot-container';

		// AI 아바타
		const loadingAvatar = document.createElement('div');
		loadingAvatar.className = 'avatar-container';

		const loadingAvatarImg = document.createElement('img');
		loadingAvatarImg.src = aiAvatarUrl;
		loadingAvatarImg.alt = 'AI Assistant';
		loadingAvatarImg.className = 'avatar-img';

		loadingAvatar.appendChild(loadingAvatarImg);
		loadingContainer.appendChild(loadingAvatar);

		// 로딩 메시지
		const loadingContent = document.createElement('div');
		loadingContent.className = 'message-content-wrapper';

		const loadingDiv = document.createElement('div');
		loadingDiv.className = 'chatbot-message bot-message loading-message';
		loadingDiv.innerHTML = `
    <div class="wave-dots">
        <div class="wave-dot"></div>
        <div class="wave-dot"></div>
        <div class="wave-dot"></div>
    </div>
`;

		loadingContent.appendChild(loadingDiv);
		loadingContainer.appendChild(loadingContent);

		chatbotMessages.appendChild(loadingContainer);
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

		// POST 요청 데이터 구성
		const requestData = {
			message: message,
			user_id: "anonymous",
			history: conversationMemory.slice(-10)
		};

		try {
			console.log('📤 POST 요청 전송:', requestData);

			const response = await fetch('https://us-central1-schooldemo-1701f.cloudfunctions.net/campbellhall_chat_stream', {
				method: 'POST',
				mode: 'cors',  // ✅ CORS 모드 명시
				credentials: 'omit',  // ✅ credentials 설정
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestData)
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}


			// 로딩 표시 제거
			loadingContainer.remove();

			// 실제 응답 메시지 컨테이너 생성
			const responseContainer = document.createElement('div');
			responseContainer.className = 'message-container bot-container';

			// AI 아바타
			const responseAvatar = document.createElement('div');
			responseAvatar.className = 'avatar-container';

			const responseAvatarImg = document.createElement('img');
			responseAvatarImg.src = aiAvatarUrl;
			responseAvatarImg.alt = 'AI Assistant';
			responseAvatarImg.className = 'avatar-img';

			responseAvatar.appendChild(responseAvatarImg);
			responseContainer.appendChild(responseAvatar);

			// 응답 메시지
			const responseContent = document.createElement('div');
			responseContent.className = 'message-content-wrapper';

			const responseDiv = document.createElement('div');
			responseDiv.className = 'chatbot-message bot-message';
			responseDiv.id = 'streamingResponse'; 
			responseContent.appendChild(responseDiv);

			// 시간 표시
			const responseTime = document.createElement('div');
			responseTime.className = 'message-time';
			responseTime.textContent = getCurrentTime();
			responseContent.appendChild(responseTime);

			responseContainer.appendChild(responseContent);
			chatbotMessages.appendChild(responseContainer);

			// ReadableStream으로 SSE 응답 처리
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let fullResponse = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					console.log('✅ 스트리밍 완료');

					// 대화 기록 저장
					conversationMemory.push({
						role: 'assistant',
						content: fullResponse,
						timestamp: new Date().toISOString()
					});

					if (conversationMemory.length > 15) {
						conversationMemory = conversationMemory.slice(-15);
					}

					if (window.innerWidth > 600) {
						chatbotInput.focus();
					}
					break;
				}

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim() === '') continue;

					if (line.startsWith('data: ')) {
						try {
							const data = JSON.parse(line.substring(6));

							if (data.type === 'chunk' && data.content) {
								fullResponse += data.content;
								responseDiv.innerHTML = formatMarkdown(fullResponse);
								chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
							}
							else if (data.type === 'complete') {
								console.log('✅ Receive a completion signal from the server');
							}
							else if (data.type === 'error') {
								console.error('❌ Server error:', data.content);
								responseDiv.textContent = `Error: ${data.content}`;
								reader.cancel();
								return;
							}
						} catch (e) {
							console.error('❌ JSON parsing error:', e, 'Line:', line);
						}
					}
				}
			}

		} catch (error) {
			console.error('❌ Fetch error:', error);

			// 에러 발생 시 로딩 표시 제거
			if (document.getElementById('loadingIndicator')) {
				loadingContainer.remove();
			}

			// 에러 메시지 표시 (아바타 포함)
			const errorContainer = document.createElement('div');
			errorContainer.className = 'message-container bot-container';

			const errorAvatar = document.createElement('div');
			errorAvatar.className = 'avatar-container';

			const errorAvatarImg = document.createElement('img');
			errorAvatarImg.src = aiAvatarUrl;
			errorAvatarImg.alt = 'AI Assistant';
			errorAvatarImg.className = 'avatar-img';

			errorAvatar.appendChild(errorAvatarImg);
			errorContainer.appendChild(errorAvatar);

			const errorContent = document.createElement('div');
			errorContent.className = 'message-content-wrapper';

			const errorDiv = document.createElement('div');
			errorDiv.className = 'chatbot-message bot-message error-message';
			errorDiv.textContent = 'A connection error has occurred, please try again.';

			errorContent.appendChild(errorDiv);

			// 에러 시간 표시
			const errorTime = document.createElement('div');
			errorTime.className = 'message-time';
			errorTime.textContent = getCurrentTime();
			errorContent.appendChild(errorTime);

			errorContainer.appendChild(errorContent);
			chatbotMessages.appendChild(errorContainer);

			chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
		}

		if (window.innerWidth <= 600) {
			chatbotInput.blur();
		} else {
			// 입력창에 포커스
			chatbotInput.focus();
		}
	}

	function showWelcomeMessage() {
		// 일반 메시지와 동일한 구조로 생성
		const welcomeContainer = document.createElement('div');
		welcomeContainer.className = 'message-container bot-container';

		// AI 아바타 (일반 메시지와 동일)
		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'avatar-container';

		const avatarImg = document.createElement('img');
		avatarImg.src = aiAvatarUrl;
		avatarImg.alt = 'AI Assistant';
		avatarImg.className = 'avatar-img';

		avatarContainer.appendChild(avatarImg);
		welcomeContainer.appendChild(avatarContainer);

		// 메시지 콘텐츠 컨테이너 (일반 메시지와 동일)
		const messageContent = document.createElement('div');
		messageContent.className = 'message-content-wrapper';

		// 웰컴 메시지 말풍선
		const welcomeDiv = document.createElement('div');
		welcomeDiv.className = 'chatbot-message bot-message';

		const welcomeText = 'Welcome to **Campbell Hall**. I\'m your **AI assistant**. What can I help you with today?';
		welcomeDiv.innerHTML = formatMarkdown(welcomeText);

		messageContent.appendChild(welcomeDiv);

		// 시간 표시 (일반 메시지와 동일)
		const timeStamp = document.createElement('div');
		timeStamp.className = 'message-time';
		timeStamp.textContent = getCurrentTime();
		messageContent.appendChild(timeStamp);

		welcomeContainer.appendChild(messageContent);
		chatbotMessages.appendChild(welcomeContainer);

		// 빠른 질문 버튼 컨테이너 추가
		showQuickQuestions();

		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}


	// 빠른 질문 버튼 표시 함수
	function showQuickQuestions() {
		const quickQuestionsDiv = document.createElement('div');
		quickQuestionsDiv.className = 'quick-questions';

		quickQuestionsDiv.innerHTML = `
        <div class="quick-questions-title">Quick questions:</div>
        <button class="quick-btn" data-question="Can you tell me how I can get to Campbell Hall?">
            🚗 How to get to Campbell Hall
        </button>
        <button class="quick-btn" data-question="What is the application process? What documents do I need to complete and submit, and what is the deadline?">
            📝 Application Process
        </button>
        <button class="quick-btn" data-question="What are the key school events taking place this month?">
            📅 Events
        </button>
        <button class="quick-btn" data-question="What facilities does Campbell Hall have?">
            🏫 School Facilities
        </button>
    `;

		chatbotMessages.appendChild(quickQuestionsDiv);

		// 빠른 질문 버튼 이벤트 리스너 추가
		const quickBtns = quickQuestionsDiv.querySelectorAll('.quick-btn');
		quickBtns.forEach(btn => {
			btn.addEventListener('click', function () {
				const question = this.getAttribute('data-question');
				chatbotInput.value = question;
				sendMessageToBackend();
			});
		});

		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	// 초기화: 챗봇 창을 숨김 상태로 시작
	chatbotWindow.style.display = 'none';

	// 초기 환영 메시지 (선택사항)
	setTimeout(() => {
		showWelcomeMessage();
	}, 1000);


});


