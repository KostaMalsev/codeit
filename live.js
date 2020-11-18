var toggle = document.querySelector('.toggle'),
    codedit = document.querySelector('cd'),
    iframe = document.querySelector('iframe');

toggle.onclick = () => {
  codedit.classList.toggle('open');
}

if (localStorage.getItem('code')) {
  // If code's in storage, show it
  codedit.innerHTML = escapeHTML(localStorage.getItem('code'));
  codedit.classList.add('open');
}

function updateFrame(html) {
  // Update iframe
  iframe.contentDocument.querySelector('html').innerHTML = html;
  
  // Run all <script> tags
  iframe.contentDocument.querySelectorAll('script').forEach(script => {
    iframe.contentWindow.eval(script.innerHTML);
  })
  
  // Set new localStorage value
  localStorage.setItem('code', html);
}

function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
