import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';
import { TextPlugin } from 'gsap/TextPlugin';

// GSAP setup for versions 11-20. Unlike lib/gsap.ts (versions 01-10) it sets
// no global defaults, because these scenes also tween plain objects (the
// puppet's joints, three.js objects) where CSS-only options don't apply.
gsap.registerPlugin(useGSAP, MotionPathPlugin, DrawSVGPlugin, Flip, CustomEase, TextPlugin);

export { gsap, useGSAP, Flip, MotionPathPlugin };
