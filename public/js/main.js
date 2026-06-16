// Header navigatie js enhancement
const nav = document.getElementById('navigatie')
const link = document.querySelector('.nav-toggle')
const sluit = document.querySelector('.nav-close')

link.addEventListener('click', function (e) {
    e.preventDefault()
    nav.classList.add('open')
    document.body.style.overflow = 'hidden'
})

sluit.addEventListener('click', function (e) {
    e.preventDefault()
    nav.classList.remove('open')
    document.body.style.overflow = ''
})

document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !link.contains(e.target)) {
        nav.classList.remove('open')
    }
})

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        nav.classList.remove('open')
        document.body.style.overflow = ''
    }
})

// spinner loading state - niet van mij dit snap ik nog niet 
document.querySelectorAll('.img-wrapper').forEach(wrapper => {
    const img = wrapper.querySelector('img');
    const spinner = wrapper.querySelector('.spinner');
    const remove = () => spinner?.remove();

    if (img?.complete) {
        remove();
    } else {
        img?.addEventListener('load', remove);
    }
});
