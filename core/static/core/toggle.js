function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
}
async function toggleConference() {
    const csrftoken = getCookie('csrftoken');
    const res = await fetch('/conference/toggle/', {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
    });
    const data = await res.json();
    console.log('toggle response', data);
}
document.getElementById('toggleBtn')?.addEventListener('click', toggleConference);