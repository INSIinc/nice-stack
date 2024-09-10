import React, { useRef, useEffect } from 'react';

interface CanvasProps {
    width: number;
    height: number;
}

const SineWavesCanvas: React.FC<CanvasProps> = ({ width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                drawSineWaves(context);
            }
        }
    }, [width, height]);

    function drawSineWaves(ctx: CanvasRenderingContext2D) {
        let startAngle = 0;
        const waveParams = [
            {
                baseAmplitude: height * 0.13,
                amplitudeModifier: (x: number) => Math.sin((Math.PI * x) / width),
                phase: Math.PI / 2,
                lineWidth: 3,
                cycle: width * Math.random() * 0.0001,
                opacityModifier: (x: number) => {
                    const distanceFromCenter = Math.abs(x - width / 2);
                    const maxDistance = width / 2;
                    return 1 - Math.pow(distanceFromCenter / maxDistance, 2);
                }
            },
            {
                baseAmplitude: height * 0.12,
                amplitudeModifier: (x: number) => Math.sin((Math.PI * x) / width),
                phase: 0,
                lineWidth: 1.5,
                cycle: width * Math.random() * 0.001,
                opacityModifier: (x: number) => {
                    const distanceFromCenter = Math.abs(x - width / 2);
                    const maxDistance = width / 2;
                    return 1 - Math.pow(distanceFromCenter / maxDistance, 2);
                }
            },
            {
                baseAmplitude: height * 0.1,
                amplitudeModifier: (x: number) => Math.sin((Math.PI * x) / width),
                phase: Math.PI,
                lineWidth: 0.5,
                cycle: width * Math.random() * 0.01,
                opacityModifier: (x: number) => {
                    const distanceFromCenter = Math.abs(x - width / 2);
                    const maxDistance = width / 2;
                    return 1 - Math.pow(distanceFromCenter / maxDistance, 2);
                }
            },
            {
                baseAmplitude: height * 0.11,
                amplitudeModifier: (x: number) => Math.sin((Math.PI * x) / width),
                phase: Math.random() * Math.PI * 2,
                lineWidth: 1.3,
                cycle: width * Math.random() * 0.1,
                opacityModifier: (x: number) => {
                    const distanceFromCenter = Math.abs(x - width / 2);
                    const maxDistance = width / 2;
                    return 1 - Math.pow(distanceFromCenter / maxDistance, 2);
                }
            }
        ];

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        function draw() {
            ctx.clearRect(0, 0, width, height);

            startAngle += 0.1;

            waveParams.forEach(param => {
                ctx.beginPath();

                for (let x = 0; x < width; x++) {
                    let y =
                        height / 2 +
                        param.baseAmplitude *
                        param.amplitudeModifier(x) *
                        Math.sin(x * param.cycle + startAngle + param.phase);

                    ctx.strokeStyle = gradient;
                    ctx.lineTo(x, y);
                }

                ctx.lineWidth = param.lineWidth;
                ctx.stroke();
            });

            requestAnimationFrame(draw);
        }

        draw();
    }

    return <canvas ref={canvasRef} width={width} height={height} className="block"></canvas>;
};

export default SineWavesCanvas;
