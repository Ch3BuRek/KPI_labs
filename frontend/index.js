import { menu } from "../backend/data.js";

const $ = id => document.getElementById(id);

function renderCategories() {
    const categories = [...new Set(menu.map(i => i.category))];

    $('cat-tabs').innerHTML =
    `<button data-cat="">All</button>` +
    categories.map(cat =>`<button data-cat="${cat}">${cat}</button>`).join('');


    $('cat-tabs').querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {renderMenu(btn.dataset.cat);});
    });
}

function renderMenu(category) {
    const items = category
    ? menu.filter(i => i.category === category)
    : menu;

    $('menu-grid').innerHTML = items.map(item => `
        <div class="menu-card">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.description}</div>
        <div class="menu-card-foot">
            <span class="menu-card-price">$${item.price.toFixed(2)}</span>
            <button class="add-btn" data-id="${item.id}">+</button>
        </div>
        </div>
    `).join('');
}

renderCategories();
renderMenu();