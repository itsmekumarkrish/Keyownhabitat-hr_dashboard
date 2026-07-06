import re

with open("index.html", "r") as f:
    content = f.read()

# Define the new structure for each card
cards = [
    ("Priya Sharma", "I never thought I could afford a down payment while paying 30k in rent every month. KeyOwn literally structured my finances so my rent became my down payment. I just got my keys!", "rgba(0, 98, 65, 0.1)", "var(--accent-indigo)", "ph-user"),
    ("Rahul Verma", "The advisory counsel is incredible. They negotiated a 10% discount on a pre-launch property that wasn't even on the market yet. The HOAS framework is brilliant.", "rgba(245, 158, 11, 0.1)", "var(--accent-gold)", "ph-user"),
    ("Anjali Desai", "Stop renting right now and use this. I wasted 5 years paying a landlord. In just 3 years with KeyOwn, my equity match allowed me to buy my dream apartment.", "rgba(30, 57, 50, 0.1)", "var(--accent-teal)", "ph-user"),
    ("Vikram Singh", "The rent-to-own concept was new to me, but KeyOwn made it so transparent. Their team guided me through every legal and financial step.", "rgba(0, 98, 65, 0.1)", "var(--accent-indigo)", "ph-user"),
    ("Sneha Reddy", "I thought villas were out of reach. With the co-investment compounding yield, my savings grew much faster than traditional deposits.", "rgba(245, 158, 11, 0.1)", "var(--accent-gold)", "ph-user"),
    ("Arjun Nair", "Why pay someone else's mortgage? The rent escalation protection alone is worth its weight in gold. Extremely satisfied.", "rgba(30, 57, 50, 0.1)", "var(--accent-teal)", "ph-user"),
    ("Kavya Menon", "We moved from a cramped 2BHK to a luxury 3BHK because we knew every rupee was building our own equity. Best decision ever.", "rgba(0, 98, 65, 0.1)", "var(--accent-indigo)", "ph-user"),
    ("Rohan Das", "When it was time to transition and buy out the equity, the paperwork was zero hassle. KeyOwn handled everything.", "rgba(245, 158, 11, 0.1)", "var(--accent-gold)", "ph-user")
]

new_html = ""
for i in range(2): # Duplicate 8 cards to make 16 total
    for name, quote, bg, color, icon in cards:
        new_html += f"""                <div class="testimonial-card">
                    <div class="benefit-icon" style="background: {bg}; color: {color};"><i class="ph {icon}"></i></div>
                    <h3 class="benefit-title">{name}</h3>
                    <p class="benefit-desc">"{quote}"</p>
                </div>\n"""

# Regex to match the entire track contents
pattern = r'(<div class="testimonials-track">).*?(</div>\s*</div>\s*<div class="slider-dots">)'
new_content = re.sub(pattern, rf'\1\n{new_html}\2', content, flags=re.DOTALL)

with open("index.html", "w") as f:
    f.write(new_content)
print("Replaced!")
