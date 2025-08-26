// const { use } = require("react");

const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn")

const API_KEY = "";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;




let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} }

// Function to create message elements
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};


const scrollToBottom = () => container.scrollTo({top: container.scrollHeight, behavior: "smooth"});


const typingEffect = (text, textElement, botMsgDiv) =>{
    textElement.textContent = "";
    const words = text.split(" ");


    let wordIndex = 0;
    typingInterval = setInterval(()=>{
        if(wordIndex < words.length){
          textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
          
          scrollToBottom();
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
        

    }, 40);
}


const generateResponse = async (botMsgDiv) => {
 const textElement = botMsgDiv.querySelector(".message-text")
 controller = new AbortController();

  chatHistory.push({
    role: "user",
    parts: [{ text: userData.message }, ...(userData.file.data ? [{inline_data:  (({fileName, isImage, ...rest}) => rest)(userData.file)}] : [])]
  });
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();
      textElement.textContent = responseText;
      typingEffect(responseText, textElement, botMsgDiv);



  chatHistory.push({
    role: "model",
    parts: [{ text: responseText } ]  
  });

  
  } catch (error) {
    textElement.style.color = "#d62939"
    textElement.textContent = error.name === "AbortError" ? "Response Generation stopped." : error.message;
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  } finally {
    userData.file = {};
  }
};

// Handle the form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage  || document.body.classList.contains("bot-responding") ) return;

  promptInput.value = "";
  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", 'img-attached', 'file-attached');






//   const userMsgHTML = `<p class="message-text">${userMessage}</p>`;


// Generate user message HTML with optional file attachment
const userMsgHTML = `
  <p class="message-text"></p>
  ${
    userData.file.data
      ? (
          userData.file.isImage
            ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
            : `<p class="file-attachment">
                 <span class="material-symbols-rounded">description</span>
                 ${userData.file.fileName}
               </p>`
        )
      : ""
  }
`;








  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    const botMsgHTML = `<img src="assests/gemini-chatbot-logo.svg" class="avatar"><p class="message-text">Just a sec....</p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");

    // botMsgHTML.querySelector(".message-text").textContent = userMessage;
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    generateResponse(botMsgDiv);
  }, 600);
};

fileInput.addEventListener("change", ()=>{
    const file = fileInput.files[0];
    if(!file) return;
    
    const isImage = file.type.startsWith("image/");
    const reader = new FileReader();
    reader.readAsDataURL(file);


    reader.onload = (e) => {
        fileInput.value = "";
        const base64String = e.target.result.split(",")[1];
        fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
        fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");


        userData.file = { fileName: file.name, data: base64String, mime_type: file.type, isImage }
    }
});

document.querySelector("#cancel-file-btn").addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("active", 'img-attached', 'file-attached');
});



document.querySelector("#stop-response-btn").addEventListener("click", () => {
    userData.file = {};
    controller?.abort();
    clearInterval(typingInterval);
     chatsContainer.querySelector(".bot-message.loading").classList.remove("loading");
     document.body.classList.remove("bot-responding");
});



document.querySelector("#delete-chats-btn").addEventListener("click", () => {
    chatHistory.length = 0;
    chatsContainer.innerHTML = "";
    document.body.classList.remove("bot-responding", "chats-active");
});




document.querySelectorAll(".suggestions-item").forEach(item => {
    item.addEventListener("click", () =>{
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
    });
});


document.addEventListener("click", ({target}) => {

    const wrapper = document.querySelector(".prompt-wrapper");
    const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains
    ("hide-controls") && (target.id === "add-file-btn" || target.id === "stop-response-btn")
    );
    wrapper.classList.toggle("hide-controls", shouldHide);
});





themeToggle.addEventListener("click", () =>{
    const isLightTheme = document.body.classList.toggle("light-theme");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode")
    themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});


    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    document.body.classList.toggle("light-theme", isLightTheme);
    themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";


promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#added-file-btn").addEventListener("click", () => fileInput.click());








// https://tech-innovation-for-good.devpost.com/
