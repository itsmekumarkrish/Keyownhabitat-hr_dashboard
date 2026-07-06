const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const reviews = [
    { name: "Priya Sharma", subtitle: "Homeowner in 48 months", quote: "I never thought I could afford a down payment while paying 30k in rent every month. KeyOwn literally structured my finances so my rent became my down payment. I just got my keys!" },
    { name: "Rahul Verma", subtitle: "Saved ₹12 Lakhs", quote: "The advisory counsel is incredible. They negotiated a 10% discount on a pre-launch property that wasn't even on the market yet. The HOAS framework is brilliant." },
    { name: "Anjali Desai", subtitle: "Transitioned to equity", quote: "Stop renting right now and use this. I wasted 5 years paying a landlord. In just 3 years with KeyOwn, my equity match allowed me to buy my dream apartment." },
    { name: "Vikram Singh", subtitle: "First-time buyer", quote: "The rent-to-own concept was new to me, but KeyOwn made it so transparent. Their team guided me through every legal and financial step." },
    { name: "Sneha Reddy", subtitle: "Secured a villa", quote: "I thought villas were out of reach. With the co-investment compounding yield, my savings grew much faster than traditional deposits." },
    { name: "Arjun Nair", subtitle: "Smart investor", quote: "Why pay someone else's mortgage? The rent escalation protection alone is worth its weight in gold. Extremely satisfied." },
    { name: "Kavya Menon", subtitle: "Upgraded lifestyle", quote: "We moved from a cramped 2BHK to a luxury 3BHK because we knew every rupee was building our own equity. Best decision ever." },
    { name: "Rohan Das", subtitle: "Zero hassle closing", quote: "When it was time to transition and buy out the equity, the paperwork was zero hassle. KeyOwn handled everything." }
];

let cardsHtml = '';
// 8 reviews * 2 (duplicated for infinite scroll) = 16 reviews
const fullReviews = [...reviews, ...reviews];

fullReviews.forEach(r => {
    cardsHtml += `
                <div class="testimonial-card">
                    <div class="stars"><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i></div>
                    <p class="quote">"${r.quote}"</p>
                    <div class="author">
                        <div class="author-avatar"><i class="ph ph-user"></i></div>
                        <div class="author-info">
                            <h4>${r.name}</h4>
                            <span>${r.subtitle}</span>
                        </div>
                    </div>
                </div>`;
});

const newReviewsSection = `<div class="testimonials-marquee-wrapper">
            <div class="testimonials-track">
${cardsHtml}
            </div>
        </div>`;

// Replace the old masonry container with the new marquee
html = html.replace(/<div class="testimonials-masonry">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/, newReviewsSection + '\n        </div>\n    </section>');

fs.writeFileSync('index.html', html);
