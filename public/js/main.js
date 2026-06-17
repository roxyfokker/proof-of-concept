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


// table of content 
// https://benfrain.com/building-a-table-of-contents-with-active-indicator-using-javascript-intersection-observers/
// https://css-tricks.com/a-few-functional-uses-for-intersection-observer-to-know-when-an-element-is-in-view/
if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('.timeline-article-section')
    const Links = document.querySelectorAll('.inhoud-link')

    const observer = new IntersectionObserver((entries) => {
        const intersecting = entries.find(entry => entry.isIntersecting)

        if (intersecting) {
            Links.forEach(link => link.classList.remove('current'))
            document.querySelector(`.inhoud-link[href="#${intersecting.target.id}"]`)?.classList.add('current')
        }
    }, { threshold: 0.3 },{ rootMargin: "0px 0px -200px 0px"})

    sections.forEach(section => observer.observe(section))
}