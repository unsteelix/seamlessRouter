console.log('main js')
let counter = 0;

window.onload = () => {
    document.onclick = () => {
    counter++
    console.log(counter)
    document.body.append(counter)
}
}



