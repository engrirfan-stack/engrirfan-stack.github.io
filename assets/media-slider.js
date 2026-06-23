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
    { src: "assets/slide-1.jpg", caption: "IEEE PES General Meeting professional highlight" },
    { src: "assets/slide-2.jpg", caption: "IEEE PES General Meeting networking and professional engagement" },
    { src: "assets/slide-3.jpg", caption: "Power systems laboratory, teaching, and student engagement" },
    { src: "assets/slide-4.jpg", caption: "Research discussion and collaborative project meeting" },
    { src: "assets/slide-5.jpg", caption: "Grid Science and power systems research collaboration" }
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
