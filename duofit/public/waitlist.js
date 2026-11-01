// Sends the e-mail from the /welcome form to the waitlist table. The key is the PUBLISHABLE key (safe in the browser);
// the table allows insert of the e-mail column only (supabase/migrations/20261101_waitlist_signups.sql).
(function () {
  var URL = 'https://wtheyjuqpidgrgehplgw.supabase.co/rest/v1/waitlist_signups';
  var KEY = 'sb_publishable_OnIN6P1goevVSfS_Gbttfw_oaqfaq_z';
  var form = document.getElementById('waitlist-form');
  if (!form) return;
  var input = document.getElementById('waitlist-email');
  var button = document.getElementById('waitlist-button');
  var msg = document.getElementById('waitlist-msg');
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function show(text, ok) {
    msg.textContent = text;
    msg.className = 'form-msg ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) {
      show('כתבו כתובת אימייל תקינה', false);
      return;
    }
    button.disabled = true;
    show('שולח...', true);
    fetch(URL, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ email: email }),
    })
      .then(function (res) {
        // 409 = this address is already on the list: the visitor gets the same happy message.
        if (res.ok || res.status === 409) {
          form.reset();
          show('נרשמתם! נעדכן אתכם ברגע שהאפליקציה זמינה.', true);
        } else {
          show('משהו השתבש. נסו שוב בעוד רגע.', false);
        }
      })
      .catch(function () {
        show('אין חיבור לאינטרנט. נסו שוב.', false);
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
