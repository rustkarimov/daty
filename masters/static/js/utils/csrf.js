// ============================================================
// CSRF-утилиты для inline-скриптов в Django-шаблонах
// (не ES-модуль, работает как обычный <script>)
// ============================================================

(function () {
    'use strict';

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function getCsrfToken() {
        return getCookie('csrftoken');
    }

    // Экспорт в window
    window.getCookie = getCookie;
    window.getCsrfToken = getCsrfToken;
})();