var labels = document.querySelectorAll('.radio-inline');

//Gives ability for custom radio inputs
labels.forEach(function(element, index) {
    var new_span = document.createElement('span');
    new_span.className = "radio-btn";
    element.append(new_span);
});

//Sites 2.0 and 3.0 class needed for design
// var footer = document.getElementsByClassName('section-1b');
// footer[0].parentNode.parentNode.classList.add("footer-row");