const categoryMenuEl = document.getElementById('category-menu');
const studyScreenEl = document.getElementById('study-screen');
const container = document.getElementById('app-container');
const countEl = document.getElementById('count');
const backToMenuBtn = document.getElementById('back-to-menu');

let deck = [];
let reviewDeck = [];
let currentCardEl = null;

// Активні слухачі pointermove/pointerup поточної картки —
// щоб знімати їх при кожному новому рендері й не накопичувати "мертві" обробники.
let activeMoveHandler = null;
let activeUpHandler = null;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ---------- Екран вибору категорії ----------
function buildCategoryMenu() {
    const categories = [...new Set(sushiData.map(item => item.category))];

    let html = '';
    html += `<button class="category-btn all" data-cat="__ALL__">
                <span>Усе меню</span>
                <span class="cnt">${sushiData.length}</span>
              </button>`;

    categories.forEach(cat => {
        const count = sushiData.filter(i => i.category === cat).length;
        html += `<button class="category-btn" data-cat="${cat}">
                    <span>${cat}</span>
                    <span class="cnt">${count}</span>
                  </button>`;
    });

    categoryMenuEl.innerHTML = `<h1>Що вчимо сьогодні?</h1>` + html;

    categoryMenuEl.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => startDeck(btn.dataset.cat));
    });
}

function startDeck(category) {
    const source = category === '__ALL__'
        ? sushiData
        : sushiData.filter(item => item.category === category);

    deck = shuffle(source);
    reviewDeck = [];

    categoryMenuEl.style.display = 'none';
    studyScreenEl.style.display = 'flex';

    renderCard();
}

backToMenuBtn.addEventListener('click', () => {
    studyScreenEl.style.display = 'none';
    categoryMenuEl.style.display = 'flex';
});

// ---------- Екран карток ----------
function renderCard() {
    container.innerHTML = '';

    // Знімаємо обробники попередньої картки, якщо вони лишились
    if (activeMoveHandler) document.removeEventListener('pointermove', activeMoveHandler);
    if (activeUpHandler) document.removeEventListener('pointerup', activeUpHandler);

    if (deck.length === 0) {
        if (reviewDeck.length > 0) {
            deck = shuffle(reviewDeck);
            reviewDeck = [];
            alert('Основна колода закінчилась. Починаємо повторення!');
        } else {
            container.innerHTML = '<h2 style="color: #00ff80; text-align:center;">Усі роли вивчені! 🎉</h2>';
            countEl.innerText = '0';
            return;
        }
    }

    countEl.innerText = deck.length + reviewDeck.length;
    const item = deck[0];

    const card = document.createElement('div');
    card.className = 'card';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.innerText = item.name;

    const back = document.createElement('div');
    back.className = 'card-face card-back';
    let ingredientsHTML = `<h3>${item.name}</h3>`;
    for (const [ing, weight] of Object.entries(item.ingredients)) {
        ingredientsHTML += `<div class="ingredient"><span>${ing}</span> <span>${weight}</span></div>`;
    }
    back.innerHTML = ingredientsHTML;

    card.appendChild(front);
    card.appendChild(back);
    container.appendChild(card);
    currentCardEl = card;

    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });

    initSwipe(card);
}

function initSwipe(card) {
    let startX = 0, currentX = 0;
    let isDragging = false;

    card.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        card.style.transition = 'none';
    });

    function onMove(e) {
        if (!isDragging) return;
        currentX = e.clientX - startX;
        const rotate = currentX * 0.1;
        card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

        if (currentX > 50) document.body.style.backgroundColor = 'var(--accent-green)';
        else if (currentX < -50) document.body.style.backgroundColor = 'var(--accent-red)';
        else document.body.style.backgroundColor = 'var(--bg-color)';
    }

    function onUp() {
        if (!isDragging) return;
        isDragging = false;
        card.style.transition = 'transform 0.4s ease-out';
        document.body.style.backgroundColor = 'var(--bg-color)';

        if (currentX > 100) {
            card.style.transform = `translateX(1000px) rotate(30deg)`;
            setTimeout(() => { deck.shift(); renderCard(); }, 300);
        } else if (currentX < -100) {
            card.style.transform = `translateX(-1000px) rotate(-30deg)`;
            setTimeout(() => {
                const missed = deck.shift();
                reviewDeck.push(missed);
                renderCard();
            }, 300);
        } else {
            const isFlipped = card.classList.contains('flipped');
            card.style.transform = isFlipped ? 'rotateY(180deg)' : 'translate(0px) rotate(0deg)';
        }
        currentX = 0;
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);

    activeMoveHandler = onMove;
    activeUpHandler = onUp;
}

// ---------- Кнопки "Знаю" / "Не знаю" ----------
document.querySelector('.btn-left').addEventListener('click', () => {
    if (deck.length === 0) return;
    const missed = deck.shift();
    reviewDeck.push(missed);
    renderCard();
});
document.querySelector('.btn-right').addEventListener('click', () => {
    if (deck.length === 0) return;
    deck.shift();
    renderCard();
});

// ---------- Запуск ----------
buildCategoryMenu();