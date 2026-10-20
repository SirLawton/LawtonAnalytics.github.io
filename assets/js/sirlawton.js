// Sir Lawton — portfolio interactions
(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Footer year
	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	// ---------- Hero: work showcase slideshow ----------
	// To swap in a real screenshot, replace the file in images/work/ (keep the name) or edit the <figure> in index.html.
	var show = document.getElementById('showcase');
	if (show) {
		var slides = show.querySelectorAll('.slide');
		var titleEl = document.getElementById('slideTitle');
		var subEl = document.getElementById('slideSub');
		var countEl = document.getElementById('slideCount');
		var dotsEl = document.getElementById('slideDots');
		var slidesEl = show.querySelector('.slides');
		var idx = 0, timer = null, paused = false;
		var INTERVAL = 6000;
		show.style.setProperty('--dur', INTERVAL + 'ms');

		// --- Live dashboard slide: typed formulas, KPI count-up, growing bars ---
		var live = show.querySelector('.slide.live');
		var liveInner = live && live.querySelector('.live-inner');
		var typedEl = document.getElementById('heroFormula');
		var formulas = [
			'=SUMIFS(Sales[Amount], Sales[Month], B$2)',
			'=XLOOKUP(A2, Staff[ID], Staff[Name])',
			'=LET(rev, SUM(B:B), cost, SUM(C:C), rev-cost)',
			'=FILTER(Orders, Orders[Status]="Late")'
		];
		var typeTimer = null;

		function typeLoop() {
			clearTimeout(typeTimer);
			if (!typedEl) return;
			if (reduceMotion) { typedEl.textContent = formulas[0]; return; }
			var fi = 0, ci = 0, deleting = false;
			(function tick() {
				var f = formulas[fi];
				typedEl.textContent = f.slice(0, ci);
				var delay = deleting ? 16 : 40;
				if (!deleting && ci === f.length) { deleting = true; delay = 1600; }
				else if (deleting && ci === 0) { deleting = false; fi = (fi + 1) % formulas.length; delay = 300; }
				ci += deleting ? -1 : 1;
				if (ci < 0) ci = 0;
				typeTimer = setTimeout(tick, delay);
			})();
		}

		function countUp(el) {
			var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
			if (reduceMotion) { el.textContent = target + suffix; return; }
			var start = null, dur = 1400;
			function step(ts) {
				if (!start) start = ts;
				var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
				el.textContent = (target * eased).toFixed(1) + suffix;
				if (p < 1) requestAnimationFrame(step);
			}
			requestAnimationFrame(step);
		}

		function playLive() {
			live.classList.remove('playing');
			void live.offsetWidth;
			setTimeout(function () { live.classList.add('playing'); }, 150);
			live.querySelectorAll('[data-count]').forEach(countUp);
			typeLoop();
		}

		// The live slide is drawn at 640x400; scale it to whatever width the slideshow has
		function fitLive() {
			if (liveInner) liveInner.style.setProperty('--s', slidesEl.clientWidth / 640);
		}
		fitLive();
		if ('ResizeObserver' in window) new ResizeObserver(fitLive).observe(slidesEl);
		else window.addEventListener('resize', fitLive);

		var dots = [];
		slides.forEach(function (s, i) {
			var d = document.createElement('button');
			d.setAttribute('aria-label', 'Show slide ' + (i + 1));
			d.addEventListener('click', function () { go(i); restart(); });
			dotsEl.appendChild(d);
			dots.push(d);
		});

		function go(n) {
			idx = (n + slides.length) % slides.length;
			slides.forEach(function (s, i) {
				s.classList.toggle('active', i === idx);
				s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
			});
			dots.forEach(function (d, i) {
				d.classList.remove('on');
				d.classList.toggle('done', i < idx);
			});
			// restart the progress animation on the active dot
			void dots[idx].offsetWidth;
			if (!reduceMotion) dots[idx].classList.add('on');
			else dots[idx].classList.add('done');
			var s = slides[idx];
			var isLive = s === live;
			slidesEl.classList.toggle('is-live', isLive);
			if (isLive) playLive(); else clearTimeout(typeTimer);
			titleEl.innerHTML = s.dataset.title;
			subEl.innerHTML = s.dataset.sub;
			countEl.textContent = (idx + 1) + ' / ' + slides.length;
		}

		function restart() {
			clearInterval(timer);
			if (reduceMotion || paused) return;
			timer = setInterval(function () { go(idx + 1); }, INTERVAL);
		}

		function pause(on) {
			paused = on;
			show.classList.toggle('paused', on);
			if (on) clearInterval(timer); else restart();
		}

		document.getElementById('slidePrev').addEventListener('click', function () { go(idx - 1); restart(); });
		document.getElementById('slideNext').addEventListener('click', function () { go(idx + 1); restart(); });
		show.addEventListener('mouseenter', function () { pause(true); });
		show.addEventListener('mouseleave', function () { pause(false); });
		show.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') { go(idx - 1); restart(); }
			if (e.key === 'ArrowRight') { go(idx + 1); restart(); }
			if (e.key === 'Enter') openLightbox();
		});

		// Swipe on touch screens
		var x0 = null;
		show.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
		show.addEventListener('touchend', function (e) {
			if (x0 === null) return;
			var dx = e.changedTouches[0].clientX - x0;
			if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); restart(); }
			x0 = null;
		});

		// Click to enlarge
		var lb = document.getElementById('lightbox');
		var lbImg = document.getElementById('lbImg');
		var lbCap = document.getElementById('lbCap');
		function openLightbox() {
			var img = slides[idx].querySelector('img');
			if (!lb || !lb.showModal || !img) return;
			lbImg.src = img.src;
			lbImg.alt = img.alt;
			lbCap.innerHTML = slides[idx].dataset.title + ' — ' + slides[idx].dataset.sub;
			clearInterval(timer);
			lb.showModal();
		}
		slidesEl.addEventListener('click', openLightbox);
		if (lb) {
			document.getElementById('lbClose').addEventListener('click', function () { lb.close(); });
			lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
			lb.addEventListener('close', function () { restart(); });
		}

		// ?slide=N opens on a given slide (handy for sharing one piece of work)
		var startAt = parseInt(new URLSearchParams(location.search).get('slide'), 10);
		go(startAt > 0 ? startAt - 1 : 0);
		restart();
	}

	// ---------- Ribbon tabs + formula bar follow scroll ----------
	var sections = document.querySelectorAll('main section[id]');
	var ribbon = document.querySelector('.ribbon');
	var tabs = document.querySelectorAll('.ribbon .tab');
	var nameBox = document.getElementById('nameBox');
	var formulaText = document.getElementById('formulaText');
	var current = null;

	function setActive(sec) {
		if (!sec || sec === current) return;
		current = sec;
		var id = sec.id;
		tabs.forEach(function (t) {
			var on = t.getAttribute('href') === '#' + id;
			t.classList.toggle('active', on);
			// keep the active tab visible when the ribbon scrolls sideways on phones
			if (on && ribbon.scrollWidth > ribbon.clientWidth) {
				ribbon.scrollTo({ left: t.offsetLeft - (ribbon.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
			}
		});
		if (nameBox && sec.dataset.cell) nameBox.textContent = sec.dataset.cell;
		if (formulaText && sec.dataset.formula) {
			formulaText.classList.add('swap');
			setTimeout(function () {
				formulaText.textContent = sec.dataset.formula;
				formulaText.classList.remove('swap');
			}, 200);
		}
	}

	if ('IntersectionObserver' in window) {
		var spy = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target); });
		}, { rootMargin: '-45% 0px -50% 0px' });
		sections.forEach(function (s) { if (s.dataset.cell) spy.observe(s); });
	}

	// ---------- Email links: offer Gmail / Outlook / app / copy ----------
	// mailto: does nothing on machines without a mail app, so every mailto link opens a small menu instead.
	var pop = null, popFor = null, popY = 0;

	function closePop() {
		if (pop) { pop.remove(); pop = null; popFor = null; }
	}

	function openPop(link) {
		closePop();
		var url = new URL(link.href);
		var to = decodeURIComponent(url.pathname);
		var subject = url.searchParams.get('subject') || '';
		var enc = encodeURIComponent;
		pop = document.createElement('div');
		pop.className = 'mail-pop';
		pop.setAttribute('role', 'menu');
		pop.innerHTML =
			'<a role="menuitem" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(to) + '&su=' + enc(subject) + '"><i class="fas fa-envelope-open-text"></i> Open in Gmail</a>' +
			'<a role="menuitem" target="_blank" rel="noopener" href="https://outlook.live.com/mail/0/deeplink/compose?to=' + enc(to) + '&subject=' + enc(subject) + '"><i class="fas fa-inbox"></i> Open in Outlook</a>' +
			'<a role="menuitem" href="' + link.href + '"><i class="fas fa-paper-plane"></i> Use my email app</a>' +
			'<button role="menuitem" type="button" data-copy><i class="far fa-copy"></i> <span>Copy email address</span></button>';
		document.body.appendChild(pop);
		popFor = link;

		var r = link.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
		var left = Math.min(Math.max(8, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 8);
		var top = r.bottom + 10;
		if (top + ph > window.innerHeight - 8) top = r.top - ph - 10;
		pop.style.left = left + 'px';
		pop.style.top = top + 'px';

		pop.querySelector('[data-copy]').addEventListener('click', function (e) {
			var label = e.currentTarget.querySelector('span');
			var done = function () { label.textContent = 'Copied: ' + to; };
			if (navigator.clipboard) navigator.clipboard.writeText(to).then(done, function () { label.textContent = to; });
			else label.textContent = to;
		});
		pop.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setTimeout(closePop, 0); }); });
		pop.querySelector('a').focus({ preventScroll: true });
		popY = window.scrollY;
	}

	document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			if (popFor === link) closePop(); else openPop(link);
		});
	});
	document.addEventListener('click', function (e) {
		if (pop && !pop.contains(e.target) && !e.target.closest('a[href^="mailto:"]')) closePop();
	});
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
	window.addEventListener('scroll', function () { if (pop && Math.abs(window.scrollY - popY) > 60) closePop(); }, { passive: true });

	// ---------- Reveal on scroll ----------
	var revealTargets = document.querySelectorAll('.section .wrap > *, .card, .project, .steps li, .post');
	if ('IntersectionObserver' in window && !reduceMotion) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
			});
		}, { threshold: 0.12 });
		revealTargets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
	}
})();
