lines_to_remove_start = 594
lines_to_remove_end = 730
file_path = 'index.html'

new_css = """      /* Navigation: Starlight Capsule */
      .nav-dock {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        width: auto;
        min-width: unset;
        
        /* The Capsule Material */
        background: rgba(8, 8, 12, 0.85);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.08); /* Fine edge */
        border-radius: 24px; /* Squircle-ish capsule */
        padding: 0.5rem 1rem;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        
        /* Premium Shadow Layering */
        box-shadow: 
          inset 0 1px 0 rgba(255, 255, 255, 0.15), /* Inner Top Shine */
          0 20px 40px -10px rgba(0, 0, 0, 0.8); /* Deep Elevation */
          
        transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .nav-dock:hover {
        transform: translateX(-50%) translateY(-2px);
        box-shadow: 
          inset 0 1px 0 rgba(255, 255, 255, 0.2), 
          0 25px 50px -10px rgba(0, 0, 0, 0.9);
      }

      .nav-item {
        position: relative;
        color: #64748b; /* Mid gray inactive */
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 18px; /* Smooth corners */
      }

      .nav-item i {
        font-size: 1.5rem;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 2;
      }
      
      .nav-item span { display: none !important; }

      /* Active State: The Magic Touch */
      .nav-item.active {
        color: #ffffff;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(217, 70, 239, 0.15));
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.1);
      }
      
      .nav-item.active i {
        transform: scale(1.1);
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
      }

      /* Clean indicators */
      .nav-item.active::before,
      .nav-item.active::after {
        content: none;
      }

      /* Desktop: Floating Side Bar */
      @media (min-width: 1024px) {
        .lg-flex-col { flex-direction: column; }
        .lg-grid-cols-12 { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }
        .lg-col-span-4 { grid-column: span 4 / span 4; }
        .lg-px-10 { padding-left: 3rem; padding-right: 3rem; }
        
        .nav-dock {
          left: 40px; top: 50%; bottom: auto; transform: translateY(-50%);
          flex-direction: column; padding: 1.25rem 0.5rem; width: auto; min-width: auto;
          gap: 1.25rem;
        }
        
        .nav-dock:hover { transform: translateY(-50%) translateX(2px); }
        
        .nav-item.active::after { content: none; }
        .nav-item.active::before { content: none; }

        .main-view-container { padding-left: 120px; padding-bottom: 2rem; }
      }
"""

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = lines_to_remove_start - 1
end_idx = lines_to_remove_end

new_lines = lines[:start_idx]
new_lines.append(new_css + '\n')
new_lines.extend(lines[end_idx:])

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
