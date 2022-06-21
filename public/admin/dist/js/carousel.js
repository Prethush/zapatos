let slideContainer = document.querySelector(".slide-container");
let slides = Array.from(slideContainer.children);
let nextBtn = document.querySelector(".right");
let prevBtn = document.querySelector(".left");
let dotsNav = document.querySelector(".nav-indicator");
let dotsControls = Array.from(dotsNav.children);

const slideSize = slides[0].getBoundingClientRect().width;

// place slides next to one another
const setSlidePosition = (slide, index) => {
  slide.style.left = slideSize * index + "px";
};

slides.forEach(setSlidePosition);

const moveToSlide = (slideContainer, currentSlide, targetSlide) => {
  slideContainer.style.transform = `translateX(-${targetSlide.style.left})`;
  currentSlide.classList.remove("active");
  targetSlide.classList.add("active");
};

const updateDots = (currentDot, targetDot) => {
  targetDot.classList.add("active");
  currentDot.classList.remove("active");
};

const hideNavControls = (slides, targetIndex) => {
  if (targetIndex === 0) {
    nextBtn.classList.remove("hidden");
    prevBtn.classList.add("hidden");
  } else if (targetIndex === slides.length - 1) {
    nextBtn.classList.add("hidden");
    prevBtn.classList.remove("hidden");
  } else {
    nextBtn.classList.remove("hidden");
    prevBtn.classList.remove("hidden");
  }
};

// move left
prevBtn.addEventListener("click", function () {
  let currentSlide = slideContainer.querySelector(".active");
  console.log(currentSlide);
  const prevSlide = currentSlide.previousElementSibling;
  let currentDot = dotsNav.querySelector(".active");
  const prevDot = currentDot.previousElementSibling;
  let targetIndex = slides.findIndex((slide) => {
    return slide === prevSlide;
  });
  moveToSlide(slideContainer, currentSlide, prevSlide);
  updateDots(currentDot, prevDot);
  hideNavControls(slides, targetIndex);
});
//  move right
nextBtn.addEventListener("click", function () {
  let currentSlide = slideContainer.querySelector(".active");
  const nextSlide = currentSlide.nextElementSibling;
  let currentDot = dotsNav.querySelector(".active");
  const nextDot = currentDot.nextElementSibling;
  let targetIndex = slides.findIndex((slide) => {
    return slide === nextSlide;
  });
  moveToSlide(slideContainer, currentSlide, nextSlide);
  updateDots(currentDot, nextDot);
  hideNavControls(slides, targetIndex);
});

dotsNav.addEventListener("click", function (e) {
  const targetDot = e.target.closest("div.indicator");
  console.log(targetDot);
  if (!targetDot) return;

  let currentSlide = slideContainer.querySelector(".active");
  let currentDot = dotsNav.querySelector(".active");
  // find index of dot clicked
  let targetIndex = dotsControls.findIndex((dot) => {
    return dot === targetDot;
  });
  let targetSlide = slides[targetIndex];
  moveToSlide(slideContainer, currentSlide, targetSlide);
  updateDots(currentDot, targetDot);
  hideNavControls(slides, targetIndex);
});
