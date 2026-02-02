// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navLinks = document.querySelector(".nav-links");

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    mobileMenuBtn.classList.toggle("active");
  });
}

// Dark Mode Toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Check for saved theme preference or default to light mode
const savedTheme = localStorage.getItem("theme") || "light-mode";
body.className = savedTheme;

themeToggle.addEventListener("click", () => {
  if (body.classList.contains("light-mode")) {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark-mode");
  } else {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    localStorage.setItem("theme", "light-mode");
  }
});

// Tab Switching
const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    // Remove active class from all buttons and panels
    tabBtns.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));

    // Add active class to clicked button and corresponding panel
    btn.classList.add("active");
    document.getElementById(tabName).classList.add("active");
  });
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  });
});

// Intersection Observer for Animation on Scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe feature cards
document.querySelectorAll(".feature-card").forEach(card => {
  card.style.opacity = "0";
  card.style.transform = "translateY(30px)";
  card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(card);
});

// Observe theme cards
document.querySelectorAll(".theme-card").forEach(card => {
  card.style.opacity = "0";
  card.style.transform = "translateY(30px)";
  card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(card);
});

// Observe CTA section
const ctaSection = document.querySelector(".cta");
if (ctaSection) {
  const ctaObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "scale(1)";
        }
      });
    },
    { threshold: 0.2 }
  );

  ctaSection.style.opacity = "0";
  ctaSection.style.transform = "scale(0.95)";
  ctaSection.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  ctaObserver.observe(ctaSection);
}

// Add scroll effect to navigation
let lastScroll = 0;
const nav = document.querySelector(".nav");

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    nav.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
  } else {
    nav.style.boxShadow = "none";
  }

  lastScroll = currentScroll;
});

// Add hover effect to transaction items
const transactionItems = document.querySelectorAll(".transaction-item, .expense-item");
transactionItems.forEach(item => {
  item.addEventListener("mouseenter", function () {
    this.style.transform = "translateX(5px)";
    this.style.transition = "transform 0.3s ease";
  });

  item.addEventListener("mouseleave", function () {
    this.style.transform = "translateX(0)";
  });
});

// Animate numbers on scroll
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = timestamp => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = "$" + value.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Observe balance elements for animation
const balanceObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains("animated")) {
        const target = entry.target;
        const value = parseInt(target.textContent.replace(/[^0-9]/g, ""));
        target.classList.add("animated");
        animateValue(target, 0, value, 1500);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".balance-amount, .balance-main").forEach(el => {
  balanceObserver.observe(el);
});

// Add ripple effect to buttons
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
  ripple.classList.add("ripple");

  const rippleEffect = button.querySelector(".ripple");
  if (rippleEffect) {
    rippleEffect.remove();
  }

  button.appendChild(ripple);
}

// Add ripple effect styles dynamically
const style = document.createElement("style");
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Apply ripple to all buttons
document.querySelectorAll(".btn-primary, .btn-large, .btn-gradient, .add-btn").forEach(button => {
  button.style.position = "relative";
  button.style.overflow = "hidden";
  button.addEventListener("click", createRipple);
});

// Console message
console.log(
  "%c💸 Vibe Finance - Money Moves Only!",
  "color: #8B5CF6; font-size: 24px; font-weight: bold;"
);
console.log("%cBuilt with Next.js, TypeScript, and MongoDB", "color: #64748b; font-size: 14px;");
console.log(
  "%cCheck out the repo: https://github.com/Ketan-K/expense-tracker",
  "color: #8B5CF6; font-size: 14px;"
);
