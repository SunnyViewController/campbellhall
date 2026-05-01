// chatbot.js

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function () {
	const toggleBtn = document.getElementById('chatbotToggleBtn');
	const closeBtn = document.getElementById('chatbotCloseBtn');
	const chatbotWindow = document.getElementById('chatbotWindow');
	const sendBtn = document.getElementById('chatbotSendBtn');
	const chatbotInput = document.getElementById('chatbotInput');
	const chatbotMessages = document.getElementById('chatbotMessages');
	const quickBtns = document.querySelectorAll('.quick-btn');

	let conversationMemory = [];

	const aiAvatarUrl = 'mascot.png';
	const userAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

	const voiceBtn = document.getElementById('voiceInputBtn');

	// ✅ 음성 모드 상태
	let voiceMode = false;
	const voiceModeBtn = document.getElementById('voiceModeBtn');

	// 음성 모드 토글
	voiceModeBtn?.addEventListener('click', () => {
		voiceMode = !voiceMode;
		if (voiceMode) {
			voiceModeBtn.style.background = '#4cc9f0';
			voiceModeBtn.title = 'Voice Mode ON';
			voiceModeBtn.textContent = '🔊';
		} else {
			voiceModeBtn.style.background = 'rgba(255,255,255,0.2)';
			voiceModeBtn.title = 'Voice Mode OFF';
			voiceModeBtn.textContent = '🔇';
			speechSynthesis.cancel();  // 음성 즉시 중지
		}
	});

	// 음성 인식 설정
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	let recognition = null;
	let isListening = false;

	if (SpeechRecognition) {
		recognition = new SpeechRecognition();
		recognition.lang = '';  // ✅ 빈 문자열 = 자동 감지
		recognition.interimResults = false;

		recognition.onresult = (event) => {
			const transcript = event.results[0][0].transcript;
			chatbotInput.value = transcript;
			voiceBtn.textContent = '🎤';
			isListening = false;
			sendMessageToBackend();
		};

		recognition.onerror = () => {
			voiceBtn.textContent = '🎤';
			isListening = false;
		};

		recognition.onend = () => {
			voiceBtn.textContent = '🎤';
			isListening = false;
		};
	}

	voiceBtn?.addEventListener('click', () => {
		speechSynthesis.cancel();

		if (!recognition) {
			alert('Speech recognition is not supported in your browser.');
			return;
		}

		// ✅ 음성 모드 자동 활성화
		if (!voiceMode) {
			voiceMode = true;
			voiceModeBtn.style.background = '#4cc9f0';
			voiceModeBtn.title = 'Voice Mode ON';
			voiceModeBtn.textContent = '🔊';
		}

		if (isListening) {
			recognition.stop();
			voiceBtn.textContent = '🎤';
			isListening = false;
		} else {
			recognition.start();
			voiceBtn.textContent = '🔴';
			isListening = true;
		}
	});

	if (window.innerWidth <= 600) {
		chatbotWindow.classList.add('initial-position');
	}

	toggleBtn.addEventListener('click', function () {
		if (chatbotWindow.style.display === 'flex') {
			chatbotWindow.style.display = 'none';
			closeMediaPanel();
		} else {
			chatbotWindow.style.display = 'flex';
			if (window.innerWidth > 600) chatbotInput.focus();
		}
	});

	document.addEventListener('click', function (event) {
		if (window.innerWidth <= 600) {
			if (document.activeElement === chatbotInput &&
				!chatbotInput.contains(event.target) &&
				!chatbotWindow.contains(event.target) &&
				chatbotWindow.style.display === 'flex') {
				chatbotInput.blur();
			}
		}
	});

	closeBtn.addEventListener('click', function () {
		speechSynthesis.cancel();
		chatbotWindow.style.display = 'none';
		closeMediaPanel();
	});

	sendBtn.addEventListener('click', sendMessageToBackend);

	chatbotInput.addEventListener('keypress', function (e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			speechSynthesis.cancel();
			sendMessageToBackend();
		}
	});

	chatbotInput.addEventListener('focus', function () {
		if (window.innerWidth <= 600) chatbotWindow.style.position = 'fixed';
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth > 600) {
			chatbotWindow.style.cssText = '';
			chatbotWindow.classList.remove('initial-position');
		} else {
			if (!chatbotWindow.classList.contains('initial-position')) {
				chatbotWindow.classList.add('initial-position');
			}
		}
	});

	// ================================================
	// 유틸리티
	// ================================================

	function getCurrentTime() {
		return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
	}

	function extractImageUrls(text) {
		const urls = [];
		const mdRegex = /!\[.*?\]\((.*?)\)/g;
		let match;
		while ((match = mdRegex.exec(text)) !== null) urls.push(match[1]);
		const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
		while ((match = urlRegex.exec(text)) !== null) {
			if (!urls.includes(match[0])) urls.push(match[0]);
		}
		return urls;
	}

	function extractVideoUrls(text) {
		const urls = [];
		const mdRegex = /\[.*?\]\((.*?\.(mp4|mov|webm|avi))\)/gi;
		let match;
		while ((match = mdRegex.exec(text)) !== null) urls.push(match[1]);
		const urlRegex = /(https?:\/\/[^\s]+\.(mp4|mov|webm|avi))/gi;
		while ((match = urlRegex.exec(text)) !== null) {
			if (!urls.includes(match[0])) urls.push(match[0]);
		}
		return urls;
	}

	function extractMapUrls(text) {
		const urls = [];
		const regex = /\[MAP:\s*(.*?)\]/g;
		let match;
		while ((match = regex.exec(text)) !== null) {
			urls.push(match[1].trim());
		}
		return urls;
	}


	function getVideoType(url) {
		if (url.endsWith('.mp4')) return 'mp4';
		if (url.endsWith('.mov')) return 'mov';
		if (url.endsWith('.webm')) return 'webm';
		if (url.endsWith('.avi')) return 'avi';
		return 'mp4';
	}

	// ================================================
	// 미디어 패널
	// ================================================

	function openMediaPanel(mediaItems, infoText, itemDataList) {
		const panel = document.getElementById('mediaSlidePanel');
		const content = document.getElementById('mediaPanelContent');
		const panelTitle = document.getElementById('panelTitle');
		const chatbotWindow = document.getElementById('chatbotWindow');
		const isMobile = window.innerWidth <= 600;

		content.innerHTML = '';
		// ✅ MAP 주소 확인
		const mapAddresses = infoText ? extractMapUrls(infoText) : [];
		// ✅ 패널 제목 동적 설정
		const hasMedia = mediaItems.length > 0;
		const hasMap = mapAddresses.length > 0;

		if (hasMedia && hasMap) {
			panelTitle.textContent = '📷🗺️ Media & Map';
		} else if (hasMap) {
			panelTitle.textContent = '🗺️ Map';
		} else if (mediaItems.some(item => item.type === 'video')) {
			panelTitle.textContent = '🎬 Media Preview';
		} else {
			panelTitle.textContent = '📷 Media Preview';
		}

		mediaItems.forEach((item, index) => {
			// 이미지/비디오 래퍼
			const wrapper = document.createElement('div');
			wrapper.className = 'media-item-wrapper';
			wrapper.style.cssText = 'cursor:pointer;border-radius:12px;overflow:hidden;margin-bottom:12px;border:2px solid transparent;transition:border 0.2s;';
			wrapper.onmouseenter = () => wrapper.style.borderColor = '#4361ee';
			wrapper.onmouseleave = () => wrapper.style.borderColor = 'transparent';

			if (item.type === 'image') {
				const img = document.createElement('img');
				img.src = item.url;
				img.alt = item.title;
				img.loading = 'lazy';
				img.style.cssText = 'width:100%;border-radius:12px;';
				img.onclick = () => openFullscreenViewer(item.url, 'image');
				wrapper.appendChild(img);
			} else if (item.type === 'video') {
				const video = document.createElement('video');
				video.controls = true;
				video.preload = 'metadata';
				video.style.cssText = 'width:100%;border-radius:12px;';
				video.onclick = () => openFullscreenViewer(item.url, 'video');
				const source = document.createElement('source');
				source.src = item.url;
				source.type = `video/${getVideoType(item.url)}`;
				video.appendChild(source);
				wrapper.appendChild(video);
			}
			content.appendChild(wrapper);

			// ✅ 해당 미디어의 ITEM_DATA 표시
			if (itemDataList && itemDataList[index]) {
				const data = itemDataList[index];
				const infoDiv = document.createElement('div');
				infoDiv.className = 'media-info-section';
				infoDiv.style.cssText = 'margin-top:0;margin-bottom:16px;padding:12px;background:#f8f9fa;border-radius:10px;font-size:13px;line-height:1.5;color:#333;';
				infoDiv.innerHTML = `
                <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${data.title || 'Item ' + (index + 1)}</div>
                ${data.description ? `<div style="color:#666;margin-bottom:4px;">${data.description}</div>` : ''}
                ${data.rating ? `<div style="color:#f59e0b;">⭐ ${data.rating}</div>` : ''}
                ${data.extra ? `<div style="color:#888;font-size:12px;">${data.extra}</div>` : ''}
            `;
				content.appendChild(infoDiv);
			}
		});

		// ✅ MAP 주소가 있으면 지도 표시
		if (infoText) {
			const mapAddresses = extractMapUrls(infoText);
			if (mapAddresses.length > 0) {
				mapAddresses.forEach(address => {
					const mapDiv = document.createElement('div');
					mapDiv.className = 'media-map-section';
					mapDiv.style.cssText = 'margin-bottom:16px;border-radius:12px;overflow:hidden;';

					const encodedAddress = encodeURIComponent(address);
					mapDiv.innerHTML = `
                <div style="font-weight:600;font-size:13px;margin-bottom:6px;color:#333;">📍 ${address}</div>
                <iframe 
                    width="100%" 
                    height="200" 
                    style="border:0;border-radius:8px;" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAAi1AjHzAh-Cu-5YuxSSOu8L3e2sU9oNA&q=${encodedAddress}">
                </iframe>
                <a href="https://www.google.com/maps/search/?api=1&query=${encodedAddress}" 
                   target="_blank" 
                   style="font-size:12px;color:#4361ee;text-decoration:none;display:inline-block;margin-top:4px;">
                   🔗 Open in Google Maps
                </a>
            `;
					content.appendChild(mapDiv);
				});
			}
		}

		// ✅ 위치 설정 - 모바일/데스크톱 분기
		const rect = chatbotWindow.getBoundingClientRect();

		if (isMobile) {
			// 모바일: 전체 화면 오버레이
			panel.style.top = '10px';
			panel.style.left = '10px';
			panel.style.right = '10px';
			panel.style.bottom = '20px';
			panel.style.width = 'auto';
			panel.style.maxHeight = 'none';
			panel.style.borderRadius = '20px';
			panel.style.zIndex = '10001';
		} else {
			// 데스크톱: 챗봇 왼쪽에 패널
			panel.style.top = rect.top + 'px';
			panel.style.left = (rect.left - 385) + 'px';
			panel.style.right = 'auto';
			panel.style.bottom = 'auto';
			panel.style.width = '370px';
			panel.style.maxHeight = rect.height + 'px';
			panel.style.borderRadius = '16px';
		}

		panel.style.display = 'flex';
	}

	function closeMediaPanel() {
		const panel = document.getElementById('mediaSlidePanel');
		if (panel) panel.style.display = 'none';
	}

	// ================================================
	// 마크다운 변환
	// ================================================

	function formatMarkdown(text) {
		if (!text) return '';

		let formatted = text;

		// 1. 이미지 마크다운 → 아이콘
		formatted = formatted.replace(/!\[(.*?)\]\(.*?\)/g, '<span style="font-size:12px;color:#888;">📷 <em>$1</em></span>');

		// 2. 비디오 링크 → 아이콘
		formatted = formatted.replace(/\[(.*?)\]\(.*?\.(mp4|mov|webm|avi)\)/gi, '<span style="font-size:12px;color:#888;">🎬 <em>$1</em></span>');

		// 3. [ITEM_DATA: ...] → 숨김
		formatted = formatted.replace(/\[ITEM_DATA:\s*(.*?)\]/g, '<span class="item-data" style="display:none;" data-info="$1"></span>');
		// ✅ [MAP: ...] → 숨김
		formatted = formatted.replace(/\[MAP:\s*(.*?)\]/g, '<span class="map-data" style="display:none;" data-address="$1"></span>');

		// 4. **bold**
		formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

		// 5. *italic*
		formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

		// 6. ## heading
		formatted = formatted.replace(/## (.*?)(\n|$)/g, '<h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">$1</h3>');

		// 7. # heading
		formatted = formatted.replace(/# (.*?)(\n|$)/g, '<h2 style="margin:0 0 10px;font-size:18px;font-weight:600;">$1</h2>');

		// 8. list
		formatted = formatted.replace(/^- (.*?)(\n|$)/gm, '<li style="margin-left:15px;margin-bottom:4px;">$1</li>');
		formatted = formatted.replace(/^(\d+)\. (.*?)(\n|$)/gm, '<li style="margin-left:15px;margin-bottom:4px;">$2</li>');

		// 9. 줄바꿈
		formatted = formatted.replace(/\n\n/g, '<br><br>');
		formatted = formatted.replace(/\n/g, '<br>');

		// 10. <li> 감싸기
		if (formatted.includes('<li>')) {
			formatted = '<ul style="margin:8px 0;padding-left:20px;">' + formatted + '</ul>';
		}

		return formatted;
	}

	// ================================================
	// 메시지 추가
	// ================================================

	function addMessage(text, sender) {
		console.log('📩 addMessage called, sender:', sender, 'text length:', text?.length);
		const container = document.createElement('div');
		container.className = `message-container ${sender}-container`;

		if (sender === 'bot') {
			const av = document.createElement('div');
			av.className = 'avatar-container';
			const img = document.createElement('img');
			img.src = aiAvatarUrl;
			img.alt = 'AI';
			img.className = 'avatar-img';
			av.appendChild(img);
			container.appendChild(av);
		}

		const content = document.createElement('div');
		content.className = 'message-content-wrapper';

		const bubble = document.createElement('div');
		bubble.className = `chatbot-message ${sender}-message`;
		bubble.innerHTML = formatMarkdown(text);
		content.appendChild(bubble);

		const time = document.createElement('div');
		time.className = 'message-time';
		time.textContent = getCurrentTime();
		content.appendChild(time);

		// ✅ 미디어 패널 + 다시 열기 버튼 (time 아래에)
		if (sender === 'bot') {
			const images = extractImageUrls(text);
			const videos = extractVideoUrls(text);
			const items = [
				...images.map(u => ({ type: 'image', url: u, title: 'Photo' })),
				...videos.map(u => ({ type: 'video', url: u, title: 'Video' }))
			];
			console.log('🔍 images found:', images.length, images);
			console.log('🔍 videos found:', videos.length, videos);
			console.log('🔍 items total:', items.length);

			const itemDataMatches = text.match(/\[ITEM_DATA:\s*(.*?)\]/g);
			let itemDataList = [];
			if (itemDataMatches) {
				itemDataList = itemDataMatches.map(m => {
					const parts = m.replace(/\[ITEM_DATA:\s*|\]/g, '').split('|').map(s => s.trim());
					return { title: parts[0] || '', description: parts[1] || '', rating: parts[2] || '', extra: parts.slice(3).join(' | ') };
				});
			}

			// ✅ MAP 주소 확인
			const mapAddresses = extractMapUrls(text);

			// ✅ 미디어나 맵이 있으면 패널 열기
			if (items.length > 0 || mapAddresses.length > 0) {
				openMediaPanel(items, text, itemDataList);

				const reopenBtn = document.createElement('button');
				reopenBtn.className = 'media-preview-btn';

				// 버튼 텍스트를 상황에 맞게
				if (items.length > 0 && mapAddresses.length > 0) {
					reopenBtn.textContent = '📷🗺️ View Attached Media & Map';
				} else if (mapAddresses.length > 0) {
					reopenBtn.textContent = '🗺️ View Map';
				} else {
					reopenBtn.textContent = '📷 View Attached Media';
				}

				reopenBtn.style.cssText = 'background:#f0f4ff;border:1px solid #4361ee;color:#4361ee;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:13px;margin-top:4px;';
				reopenBtn.onclick = () => {
					openMediaPanel(items, text, itemDataList);
				};
				content.appendChild(reopenBtn);
			}
		}

		container.appendChild(content);

		// ✅ "다시 듣기" 버튼만 남김
		if (sender === 'bot') {
			const cleanText = text
				.replace(/\[MAP:.*?\]/g, '')
				.replace(/\[ITEM_DATA:.*?\]/g, '')
				.replace(/!\[.*?\]\(.*?\)/g, '')
				.replace(/[*#]/g, '')
				.replace(/<[^>]*>/g, '');

			const speakBtn = document.createElement('button');
			speakBtn.textContent = '🔊 Listen again';
			speakBtn.title = 'Listen to response again';
			speakBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:12px;padding:2px 4px;margin-top:2px;color:#4361ee;';
			speakBtn.onclick = () => {
				speechSynthesis.cancel();
				const utterance = new SpeechSynthesisUtterance(cleanText);
				utterance.lang = /[가-힣]/.test(cleanText) ? 'ko-KR' : 'en-US';
				utterance.rate = 1.0;
				speechSynthesis.speak(utterance);
			};
			content.appendChild(speakBtn);
		}

		if (sender === 'user') {
			const ua = document.createElement('div');
			ua.className = 'avatar-container user-avatar';
			const ui = document.createElement('img');
			ui.src = userAvatarUrl;
			ui.alt = 'You';
			ui.className = 'avatar-img';
			ua.appendChild(ui);
			container.appendChild(ua);
		}

		chatbotMessages.appendChild(container);
		conversationMemory.push({ role: sender === 'user' ? 'user' : 'assistant', content: text, timestamp: new Date().toISOString() });
		if (conversationMemory.length > 15) conversationMemory = conversationMemory.slice(-15);
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	// ================================================
	// 메시지 전송
	// ================================================

	async function sendMessageToBackend() {
		speechSynthesis.cancel();
		const message = chatbotInput.value.trim();
		if (!message) return;

		addMessage(message, 'user');
		chatbotInput.value = '';

		// 로딩
		const loadContainer = document.createElement('div');
		loadContainer.className = 'message-container bot-container';
		const loadAvatar = document.createElement('div');
		loadAvatar.className = 'avatar-container';
		const lai = document.createElement('img');
		lai.src = aiAvatarUrl;
		lai.alt = 'AI';
		lai.className = 'avatar-img';
		loadAvatar.appendChild(lai);
		loadContainer.appendChild(loadAvatar);
		const loadContent = document.createElement('div');
		loadContent.className = 'message-content-wrapper';
		const loadDiv = document.createElement('div');
		loadDiv.className = 'chatbot-message bot-message loading-message';
		loadDiv.innerHTML = '<div class="wave-dots"><div class="wave-dot"></div><div class="wave-dot"></div><div class="wave-dot"></div></div>';
		loadContent.appendChild(loadDiv);
		loadContainer.appendChild(loadContent);
		chatbotMessages.appendChild(loadContainer);
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

		const requestData = {
			message: message,
			school_id: "2ZQLb1N7bafnESAPXauOIL2y0m03",
			user_id: "anonymous",
			history: conversationMemory.slice(-10)
		};

		try {
			const response = await fetch('https://chat-stream-gmq4inexiq-uc.a.run.app/chat_stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestData)
			});

			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			loadContainer.remove();

			const respContainer = document.createElement('div');
			respContainer.className = 'message-container bot-container';
			const respAvatar = document.createElement('div');
			respAvatar.className = 'avatar-container';
			const rai = document.createElement('img');
			rai.src = aiAvatarUrl;
			rai.alt = 'AI';
			rai.className = 'avatar-img';
			respAvatar.appendChild(rai);
			respContainer.appendChild(respAvatar);

			const respContent = document.createElement('div');
			respContent.className = 'message-content-wrapper';
			const respDiv = document.createElement('div');
			respDiv.className = 'chatbot-message bot-message';
			respContent.appendChild(respDiv);
			const respTime = document.createElement('div');
			respTime.className = 'message-time';
			respTime.textContent = getCurrentTime();
			respContent.appendChild(respTime);
			respContainer.appendChild(respContent);
			chatbotMessages.appendChild(respContainer);

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '', fullResponse = '';
			// 스트리밍 중 음성 읽기를 위한 변수
			let voiceQueue = '';
			let voiceTimeout = null;

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					// ✅ 스트리밍 중 보여준 응답 제거
					respContainer.remove();
					// ✅ addMessage로 bot 응답 추가 (패널, 버튼 자동 처리)
					addMessage(fullResponse, 'bot');

					if (window.innerWidth > 600) chatbotInput.focus();
					break;
				}
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';
				for (const line of lines) {
					if (!line.trim() || !line.startsWith('data: ')) continue;
					try {
						const d = JSON.parse(line.substring(6));
						if (d.type === 'chunk' && d.content) {
							fullResponse += d.content;
							respDiv.innerHTML = formatMarkdown(fullResponse);
							chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

							// ✅ 문장 단위로 실시간 음성 읽기
							if (voiceMode) {
								voiceQueue += d.content;

								// 문장 종료 문자(. ! ? \n)가 나오면 읽기
								if (/[.!?\n]$/.test(voiceQueue) && voiceQueue.trim().length > 10) {
									clearTimeout(voiceTimeout);
									const textToSpeak = voiceQueue
										.replace(/\[MAP:.*?\]/g, '')
										.replace(/\[ITEM_DATA:.*?\]/g, '')
										.replace(/!\[.*?\]\(.*?\)/g, '')
										.replace(/[*#]/g, '')
										.trim();

									if (textToSpeak.length > 5) {
										const utterance = new SpeechSynthesisUtterance(textToSpeak);
										utterance.lang = /[가-힣]/.test(textToSpeak) ? 'ko-KR' : 'en-US';
										utterance.rate = 1.1;
										speechSynthesis.speak(utterance);
									}
									voiceQueue = '';
								}
							}
						} else if (d.type === 'error') {
							respDiv.textContent = `Error: ${d.content}`;
							reader.cancel();
							return;
						}
					} catch (e) { /* parse error */ }
				}
			}
		} catch (error) {
			console.error('Fetch error:', error);
			loadContainer.remove();
			const errContainer = document.createElement('div');
			errContainer.className = 'message-container bot-container';
			const errAvatar = document.createElement('div');
			errAvatar.className = 'avatar-container';
			const eai = document.createElement('img');
			eai.src = aiAvatarUrl;
			eai.alt = 'AI';
			eai.className = 'avatar-img';
			errAvatar.appendChild(eai);
			errContainer.appendChild(errAvatar);
			const errContent = document.createElement('div');
			errContent.className = 'message-content-wrapper';
			const errDiv = document.createElement('div');
			errDiv.className = 'chatbot-message bot-message error-message';
			errDiv.textContent = 'A connection error has occurred, please try again.';
			errContent.appendChild(errDiv);
			errContainer.appendChild(errContent);
			chatbotMessages.appendChild(errContainer);
			chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
		}

		if (window.innerWidth <= 600) chatbotInput.blur();
		else chatbotInput.focus();
	}

	// ================================================
	// 웰컴 메시지
	// ================================================

	function showWelcomeMessage() {
		const wc = document.createElement('div');
		wc.className = 'message-container bot-container';
		const wa = document.createElement('div');
		wa.className = 'avatar-container';
		const wi = document.createElement('img');
		wi.src = aiAvatarUrl;
		wi.alt = 'AI';
		wi.className = 'avatar-img';
		wa.appendChild(wi);
		wc.appendChild(wa);
		const wm = document.createElement('div');
		wm.className = 'message-content-wrapper';
		const wb = document.createElement('div');
		wb.className = 'chatbot-message bot-message';
		wb.innerHTML = formatMarkdown("Welcome to **Campbell Hall**. I'm your **Campbell Hall AI assistant**. What can I help you with today?");
		wm.appendChild(wb);
		const wt = document.createElement('div');
		wt.className = 'message-time';
		wt.textContent = getCurrentTime();
		wm.appendChild(wt);
		wc.appendChild(wm);
		chatbotMessages.appendChild(wc);
		showQuickQuestions();
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	function showQuickQuestions() {
		const qq = document.createElement('div');
		qq.className = 'quick-questions';
		qq.innerHTML = `
			<div class="quick-questions-title">Quick questions:</div>
			<button class="quick-btn" data-question="Can you tell me how I can get to Campbell Hall?">🚗 How to get to Campbell Hall</button>
			<button class="quick-btn" data-question="What is the application process? What documents do I need to complete and submit, and what is the deadline?">📝 Application Process</button>
			<button class="quick-btn" data-question="What are the key school events taking place this month?">📅 Events</button>
			<button class="quick-btn" data-question="What facilities does Campbell Hall have?">🏫 School Facilities</button>`;
		chatbotMessages.appendChild(qq);
		qq.querySelectorAll('.quick-btn').forEach(btn => {
			btn.addEventListener('click', function () {
				chatbotInput.value = this.getAttribute('data-question');
				sendMessageToBackend();
			});
		});
		chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
	}

	chatbotWindow.style.display = 'none';
	setTimeout(showWelcomeMessage, 1000);
});

// 전역 함수로 등록 (HTML onclick에서 호출 가능하게)
function closeMediaPanel() {
	const panel = document.getElementById('mediaSlidePanel');
	if (panel) {
		panel.style.display = 'none';
	}
}

// 전역: 전체화면 뷰어
function openFullscreenViewer(src, type) {
	const overlay = document.createElement('div');
	overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
	overlay.onclick = () => overlay.remove();

	if (type === 'image') {
		const img = document.createElement('img');
		img.src = src;
		img.style.cssText = 'max-width:95vw;max-height:95vh;object-fit:contain;';
		overlay.appendChild(img);
	} else {
		const video = document.createElement('video');
		video.src = src;
		video.controls = true;
		video.autoplay = true;
		video.style.cssText = 'max-width:95vw;max-height:95vh;';
		video.onclick = (e) => e.stopPropagation();
		overlay.appendChild(video);
	}
	document.body.appendChild(overlay);
}