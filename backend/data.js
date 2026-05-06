export const RESTAURANT = { lat: 50.4501, lng: 30.5234 };

export const DELIVERY_LOCATIONS = [
    { address: 'вул. Хрещатик, 46',                  lat: 50.4439, lng: 30.5208 },
    { address: 'вул. Велика Васильківська, 5',      lat: 50.4411, lng: 30.5211 },
    { address: 'вул. Саксаганського, 42',           lat: 50.4372, lng: 30.5113 },
    { address: 'вул. Антоновича, 33',               lat: 50.4354, lng: 30.5133 },
    { address: 'вул. Гетьмана Павла Скоропадського, 11', lat: 50.4398, lng: 30.5147 },
    { address: 'вул. Паньківська, 8',               lat: 50.4385, lng: 30.5065 },
    { address: 'вул. Євгена Чикаленка, 19',          lat: 50.4437, lng: 30.5190 },
    { address: 'вул. Прорізна, 15',                 lat: 50.4468, lng: 30.5205 },
    { address: 'вул. Богдана Хмельницького, 32',    lat: 50.4462, lng: 30.5131 },
    { address: 'вул. Золотоворітська, 2',           lat: 50.4507, lng: 30.5152 },
    { address: 'вул. Ярославів Вал, 14',            lat: 50.4509, lng: 30.5110 },
    { address: 'вул. Рейтарська, 22',               lat: 50.4526, lng: 30.5114 },
    { address: 'вул. Десятинна, 5',                 lat: 50.4566, lng: 30.5178 },
    { address: 'Андріївський узвіз, 13',            lat: 50.4599, lng: 30.5149 },
    { address: 'вул. Сагайдачного, 28',             lat: 50.4608, lng: 30.5241 },
    { address: 'вул. Спаська, 10',                  lat: 50.4636, lng: 30.5208 },
    { address: 'Поштова площа, 2',                  lat: 50.4593, lng: 30.5273 },
    { address: 'вул. Михайла Грушевського, 4',      lat: 50.4513, lng: 30.5284 },
    { address: 'вул. Інститутська, 18',             lat: 50.4444, lng: 30.5317 },
    { address: 'вул. Шовковична, 42',               lat: 50.4398, lng: 30.5332 },
];

export const categories = [
  { id: 'burgers', name: 'Бургери та сандвічі' },
  { id: 'chicken', name: 'Курка та риба' },
  { id: 'sides', name: 'Картопля та гарніри' },
  { id: 'drinks', name: 'Напої' },
  { id: 'desserts', name: 'Десерти' },
];

export const menu = [
  { id: 'm1', category: 'burgers', name: 'Біг Мак', description: '...', price: 105.00, prepTime: 3 },
  { id: 'm2', category: 'burgers', name: 'Роял Чізбургер', description: '...', price: 125.00, prepTime: 4 },
  { id: 'm3', category: 'burgers', name: 'Дабл Чізбургер', description: '...', price: 89.00,  prepTime: 2 },
  { id: 'm4', category: 'burgers', name: 'Гамбургер', description: '...', price: 45.00,  prepTime: 2 },
  
  { id: 'm5', category: 'chicken', name: 'Чікен Макнагетс (9 шт)', description: '...', price: 110.00, prepTime: 3 },
  { id: 'm6', category: 'chicken', name: 'МакЧікен', description: '...', price: 95.00,  prepTime: 3 },
  { id: 'm7', category: 'chicken', name: 'Філе-о-фіш', description: '...', price: 100.00, prepTime: 4 },
  
  { id: 'm8',  category: 'sides', name: 'Картопля Фрі (сер)', description: '...', price: 59.00,  prepTime: 2 },
  { id: 'm9',  category: 'sides', name: 'Картопляні Діпи', description: '...', price: 65.00,  prepTime: 3 },

  { id: 'm10', category: 'drinks', name: 'Кока-Кола (0.5)', description: '...', price: 42.00,  prepTime: 1 },
  { id: 'm11', category: 'drinks', name: 'Апельсиновий сік', description: '...', price: 55.00,  prepTime: 1 },
  { id: 'm12', category: 'drinks', name: 'Лате (сер)',description: '...', price: 55.00,  prepTime: 2 },
  
  { id: 'm13', category: 'desserts', name: 'МакФлурі Орео', description: '...', price: 75.00,  prepTime: 2 },
  { id: 'm14', category: 'desserts', name: 'Вишневий пиріг', description: '...', price: 49.00,  prepTime: 5 },
  { id: 'm15', category: 'desserts', name: 'Ріжок', description: '...', price: 35.00,  prepTime: 1 },
];