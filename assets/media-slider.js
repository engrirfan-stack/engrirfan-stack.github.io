/*
  Five-slide rotating media showcase.
  Upload images as:
  assets/slide-1.jpg
  assets/slide-2.jpg
  assets/slide-3.jpg
  assets/slide-4.jpg
  assets/slide-5.jpg
*/

(function () {
  const section = document.getElementById("featured-media");
  const img = document.getElementById("media-slide");
  const caption = document.getElementById("media-caption");
  if (!section || !img || !caption) return;

const slides = [
{ src: "assets/slide-1.jpg", caption: "IEEE PES GM with A. sec Gene Rodrigues, U.S. Department of Energy" },
{ src: "assets/slide-2.jpg", caption: "IEEE PES GM with the founder of Schweitzer Engineering Laboratories" },
{ src: "assets/slide-3.jpg", caption: "Electrical and electronics engineering laboratory engagement" },
{ src: "assets/slide-4.jpg", caption: "Research group mentoring and project discussion" },
{ src: "assets/slide-5.jpg", caption: "LANL mentors Dr. Russel Bent and Dr. Harsha Nagranjan at Grid Science" }
];


  let idx = 0;

  function showSlide() {
    const s = slides[idx % slides.length];
    img.classList.remove("is-visible");

    window.setTimeout(function () {
      img.src = s.src;
      img.alt = s.caption;
      caption.textContent = s.caption;
      img.classList.add("is-visible");
      idx += 1;
    }, 180);
  }

  img.addEventListener("load", function () {
    img.classList.add("is-visible");
  });

  showSlide();
  window.setInterval(showSlide, 5200);
})();
