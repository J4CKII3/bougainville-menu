window.BougainvilleMenu = Object.freeze({
  pdf: 'menu-bougainville.pdf',
  welcome: {
    mainPhoto: 'photo.jpeg',
    detailPhoto: 'photo3.jpeg'
  },
  cover: {
    background: 'photo2.jpeg',
    brand: 'Bougainville',
    subtitle: 'Café Lounge',
    prompt: 'Utilisez les flèches pour tourner la page'
  },
  pages: Object.freeze([
    Object.freeze({ id: 'glaces-gateaux', title: 'Glaces, gâteaux & crêpes', image: 'menu-page-01.jpg' }),
    Object.freeze({ id: 'cafes-thes', title: 'Cafés, thés & boissons', image: 'menu-page-02.jpg' }),
    Object.freeze({ id: 'pizzas', title: 'Pizzas', image: 'menu-page-03.jpg' }),
    Object.freeze({ id: 'salades-specialites', title: 'Salades & spécialités', image: 'menu-page-04.jpg' }),
    Object.freeze({ id: 'petit-dejeuner', title: 'Petit-déjeuner', image: 'menu-page-05.jpg' }),
    Object.freeze({ id: 'petit-dejeuner-suite', title: 'Petit-déjeuner · suite', image: 'menu-page-06.jpg' })
  ])
});
