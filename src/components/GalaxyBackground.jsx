import React, { useEffect, useRef } from 'react';

export default function GalaxyBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 150, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isHovering = true;
    };
    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.isHovering = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const starColors = [
      { r: 244, g: 63, b: 94 },
      { r: 217, g: 70, b: 239 },
      { r: 14, g: 165, b: 233 },
      { r: 56, g: 189, b: 248 },
      { r: 251, g: 191, b: 36 },
      { r: 255, g: 255, b: 255 }
    ];

    let backgroundStars = [];
    let hyperStars = [];
    let particles = [];
    let shootingStars = [];

    const initElements = () => {
      backgroundStars = [];
      hyperStars = [];
      particles = [];
      shootingStars = [];

      const numStars = Math.min(Math.floor((width * height) / 4800), 320);
      for (let i = 0; i < numStars; i++) {
        const c = starColors[Math.floor(Math.random() * starColors.length)];
        backgroundStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.3,
          baseAlpha: Math.random() * 0.65 + 0.15,
          twinkleSpeed: Math.random() * 0.025 + 0.008,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: c
        });
      }

      const numHyper = Math.min(Math.floor(width / 180), 14);
      for (let i = 0; i < numHyper; i++) {
        const c = starColors[Math.floor(Math.random() * starColors.length)];
        hyperStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.2 + 1.6,
          spikeLength: Math.random() * 14 + 10,
          baseAlpha: Math.random() * 0.35 + 0.55,
          pulseSpeed: Math.random() * 0.018 + 0.008,
          pulseOffset: Math.random() * Math.PI * 2,
          color: c
        });
      }

      const numParticles = Math.min(Math.floor((width * height) / 15000), 64);
      for (let i = 0; i < numParticles; i++) {
        const c = starColors[Math.floor(Math.random() * starColors.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.8 + 1,
          color: c,
          baseAlpha: Math.random() * 0.5 + 0.35,
          pulseSpeed: Math.random() * 0.015 + 0.008,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    };

    initElements();

    let lastShootingStarTime = Date.now();
    const maybeSpawnShootingStar = () => {
      const now = Date.now();
      if (now - lastShootingStarTime > 2200 && Math.random() < 0.032) {
        lastShootingStarTime = now;
        shootingStars.push({
          x: Math.random() * width * 0.85,
          y: Math.random() * height * 0.45,
          length: Math.random() * 130 + 70,
          speed: Math.random() * 11 + 7,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
          alpha: 1,
          decay: Math.random() * 0.016 + 0.011,
          color: Math.random() > 0.5 ? '#38bdf8' : '#f43f5e'
        });
      }
    };

    let tick = 0;
    const render = () => {
      tick++;
      const reduceMotion = document.documentElement.getAttribute('data-reduce-motion') === '1';

      // Theme-aware deep space base + nebula (no light theme)
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      let bgGrad;
      if (theme === 'void') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#000000'); bgGrad.addColorStop(1, '#000000');
      } else if (theme === 'nebula') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1a0b2e'); bgGrad.addColorStop(0.5, '#2a0e4a'); bgGrad.addColorStop(1, '#1a0b2e');
      } else if (theme === 'ocean') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#021a1a'); bgGrad.addColorStop(0.5, '#042f2e'); bgGrad.addColorStop(1, '#083030');
      } else if (theme === 'ember') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#1a0808'); bgGrad.addColorStop(0.5, '#1c0a0a'); bgGrad.addColorStop(1, '#2a0f0f');
      } else if (theme === 'aurora') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#05140f'); bgGrad.addColorStop(0.5, '#0a1f1a'); bgGrad.addColorStop(1, '#0f2a1e');
      } else if (theme === 'dim') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#020617'); bgGrad.addColorStop(1, '#020617');
      } else {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#020414'); bgGrad.addColorStop(0.5, '#030712'); bgGrad.addColorStop(1, '#080d24');
      }
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

      // Theme-aware nebula clouds — UI + background change together
      const nebulaSets = {
        dark: [
          { x:0.78,y:0.22,r:0.42, c:['rgba(120,40,180,0.20)','rgba(168,85,247,0.14)','rgba(236,72,153,0.08)'] },
          { x:0.32,y:0.48,r:0.50, c:['rgba(236,72,153,0.16)','rgba(217,70,239,0.11)','rgba(168,85,247,0.06)'] },
          { x:0.52,y:0.72,r:0.48, c:['rgba(14,100,190,0.18)','rgba(56,120,220,0.10)','rgba(99,102,241,0.06)'] },
        ],
        void: [
          { x:0.5,y:0.5,r:0.30, c:['rgba(40,40,45,0.06)','rgba(60,60,65,0.03)','rgba(0,0,0,0)'] },
        ],
        nebula: [
          { x:0.78,y:0.22,r:0.45, c:['rgba(140,30,200,0.32)','rgba(180,40,220,0.22)','rgba(220,60,180,0.12)'] },
          { x:0.32,y:0.48,r:0.52, c:['rgba(220,40,160,0.28)','rgba(200,30,180,0.18)','rgba(160,40,200,0.10)'] },
          { x:0.52,y:0.72,r:0.50, c:['rgba(120,30,180,0.22)','rgba(140,40,200,0.14)','rgba(100,30,160,0.08)'] },
        ],
        ocean: [
          { x:0.78,y:0.22,r:0.42, c:['rgba(0,120,160,0.20)','rgba(20,184,166,0.14)','rgba(56,189,248,0.08)'] },
          { x:0.32,y:0.48,r:0.50, c:['rgba(6,182,212,0.16)','rgba(14,165,233,0.11)','rgba(56,189,248,0.06)'] },
          { x:0.52,y:0.72,r:0.48, c:['rgba(14,100,160,0.18)','rgba(20,120,180,0.10)','rgba(14,80,140,0.06)'] },
        ],
        ember: [
          { x:0.78,y:0.22,r:0.42, c:['rgba(180,40,20,0.20)','rgba(220,60,20,0.14)','rgba(245,120,20,0.08)'] },
          { x:0.32,y:0.48,r:0.50, c:['rgba(220,120,20,0.16)','rgba(245,158,11,0.11)','rgba(220,80,20,0.06)'] },
          { x:0.52,y:0.72,r:0.48, c:['rgba(180,60,20,0.18)','rgba(200,80,20,0.10)','rgba(160,40,20,0.06)'] },
        ],
        aurora: [
          { x:0.78,y:0.22,r:0.42, c:['rgba(20,120,80,0.20)','rgba(34,197,94,0.14)','rgba(56,220,120,0.08)'] },
          { x:0.32,y:0.48,r:0.50, c:['rgba(34,197,94,0.16)','rgba(99,102,241,0.11)','rgba(168,85,247,0.06)'] },
          { x:0.52,y:0.72,r:0.48, c:['rgba(20,140,100,0.18)','rgba(30,160,120,0.10)','rgba(20,100,80,0.06)'] },
        ],
        dim: [
          { x:0.78,y:0.22,r:0.42, c:['rgba(80,30,120,0.10)','rgba(100,40,140,0.06)','rgba(0,0,0,0)'] },
          { x:0.32,y:0.48,r:0.50, c:['rgba(80,40,100,0.08)','rgba(90,50,120,0.05)','rgba(0,0,0,0)'] },
        ]
      };
      const clouds = nebulaSets[theme] || nebulaSets.dark;
      clouds.forEach((cloud, i) => {
        const driftX = reduceMotion ? 0 : Math.sin(tick*0.0007 + i)*14;
        const driftY = reduceMotion ? 0 : Math.cos(tick*0.0006 + i)*10;
        const x = width * cloud.x + driftX;
        const y = height * cloud.y + driftY;
        const g = ctx.createRadialGradient(x, y, 20, x, y, width * cloud.r);
        g.addColorStop(0, cloud.c[0]); g.addColorStop(0.30, cloud.c[1]); g.addColorStop(0.60, cloud.c[2]); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
      });
      // central glow — theme tinted, not in void
      if (theme !== 'void') {
        const x = width*0.58, y=height*0.50;
        const pulse = reduceMotion?1:1+Math.sin(tick*0.006)*0.04;
        const g = ctx.createRadialGradient(x,y,0,x,y,85*pulse);
        const core = theme==='ocean'? ['rgba(120,220,255,0.16)','rgba(80,180,220,0.08)','rgba(40,120,160,0.04)'] :
                     theme==='ember'? ['rgba(255,180,80,0.16)','rgba(220,120,40,0.08)','rgba(160,60,20,0.04)'] :
                     theme==='aurora'? ['rgba(120,255,180,0.16)','rgba(80,220,140,0.08)','rgba(40,160,100,0.04)'] :
                     theme==='nebula'? ['rgba(220,120,255,0.22)','rgba(180,80,220,0.12)','rgba(120,40,180,0.06)'] :
                     ['rgba(255,180,220,0.14)','rgba(220,120,200,0.08)','rgba(120,90,200,0.04)'];
        g.addColorStop(0, core[0]); g.addColorStop(0.28, core[1]); g.addColorStop(0.62, core[2]); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,85*pulse,52*pulse,0,0,Math.PI*2); ctx.fill();
      }

      // Background stardust (twinkle)
      for (let star of backgroundStars) {
        const twinkle = reduceMotion ? 1 : Math.sin(tick * star.twinkleSpeed + star.twinkleOffset) * 0.38 + 0.62;
        const alpha = Math.max(0.1, star.baseAlpha * twinkle);
        const { r, g, b } = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      // Hyper stars (pulse + diffraction)
      for (let star of hyperStars) {
        const pulse = reduceMotion ? 1 : Math.sin(tick * star.pulseSpeed + star.pulseOffset) * 0.28 + 0.72;
        const alpha = star.baseAlpha * pulse;
        const { r, g, b } = star.color;
        const halo = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 6);
        halo.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.85})`);
        halo.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.28})`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
        const len = star.spikeLength * pulse;
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.75})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(star.x - len, star.y); ctx.lineTo(star.x + len, star.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(star.x, star.y - len); ctx.lineTo(star.x, star.y + len); ctx.stroke();
        ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      }

      // Constellation particles (interactive)
      const maxConnectDist = 115;
      const mouse = mouseRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) { p.x = 0; p.vx *= -1; }
          if (p.x > width) { p.x = width; p.vx *= -1; }
          if (p.y < 0) { p.y = 0; p.vy *= -1; }
          if (p.y > height) { p.y = height; p.vy *= -1; }
        }
        if (mouse.isHovering) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * force * 1.4;
            p.y -= Math.sin(angle) * force * 1.4;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56,189,248,${(1 - dist/mouse.radius)*0.35})`;
            ctx.lineWidth = 0.9; ctx.stroke();
          }
        }
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x, dy = p.y - p2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < maxConnectDist) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168,85,247,${(1 - dist/maxConnectDist)*0.2})`;
            ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
        const pulse = reduceMotion ? 1 : Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.28 + 0.72;
        const alpha = p.baseAlpha * pulse;
        const { r, g, b } = p.color;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.2);
        glow.addColorStop(0, `rgba(${r},${g},${b},${alpha*0.85})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius*3.2, 0, Math.PI*2); ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`; ctx.fill();
      }

      // Shooting stars
      maybeSpawnShootingStar();
      for (let k = shootingStars.length - 1; k >= 0; k--) {
        const s = shootingStars[k];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= s.decay;
        if (s.alpha <= 0 || s.x > width || s.y > height) { shootingStars.splice(k,1); continue; }
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.7, s.color);
        grad.addColorStop(1, '#ffffff');
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = s.color; ctx.stroke(); ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="galaxy-bg fixed inset-0 pointer-events-none z-0 overflow-hidden bg-transparent" style={{ opacity: `calc(var(--sg-galaxy-intensity, 70%) * 1)` }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(3,7,18,0.62) 100%)' }} />
    </div>
  );
}
