/*
  Slide media showcase.
  Upload images to the assets folder using the exact filenames below.
*/

(function () {
  const section = document.getElementById("featured-media");
  const img = document.getElementById("media-slide");
  const caption = document.getElementById("media-caption");
  if (!section || !img || !caption) return;

  const slides = [
    { src: "assets/slide-1.jpg", caption: "IEEE PES GM with the founder of Schweitzer Engineering Laboratories" },
    { src: "assets/slide-2.jpg", caption: "IEEE PES GM with Gene Rodrigues, U.S. Department of Energy" },
    { src: "assets/slide-3.jpg", caption: "Electrical and electronics engineering laboratory engagement" },
    { src: "assets/slide-4.jpg", caption: "Research group mentoring and project discussion" },
    { src: "assets/slide-5.jpg", caption: "With LANL mentors Dr. Russell Bent and Dr. Harsha Nagarajan at Grid Science" },
    { src: "assets/slide-6.jpg", caption: "Power and Energy Group at Texas A&M University" },
    { src: "assets/slide-7.jpg", caption: "PSAL Research Group with Dr. Karen L. Butler-Purry" },
    { src: "assets/slide-8.jpg", caption: "Presenting Texas A&M and LANL research work" },
    { src: "assets/slide-9.jpg", caption: "With the Texas A&M mascot" }
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
