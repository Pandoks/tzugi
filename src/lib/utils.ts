/**
 * Random functions that help out
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (style: Record<string, number | string | undefined>): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, '');
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t
      });
    },
    easing: cubicOut
  };
};

export const paginationTextGenerator = ({
  pageIndex,
  pageCount
}: {
  pageIndex: number;
  pageCount: number;
}): string[] => {
  if (pageCount === 1) {
    return ['current'];
  }

  let pages: string[] = [];

  const PAGINATION_BUTTONS = 7;
  if (pageCount <= PAGINATION_BUTTONS) {
    for (let index = 0; index < pageCount; index++) {
      pages.push(index === pageIndex ? 'current' : (index + 1).toString());
    }
  } else if (pageIndex < 4) {
    // beginning of pagination list
    for (let index = 0; index < 5; index++) {
      pages.push(index === pageIndex ? 'current' : (index + 1).toString());
    }
    pages.push('...');
    pages.push(pageCount.toString());
  } else if (pageIndex >= pageCount - 4) {
    // end of pagination list
    pages.push('1');
    pages.push('...');
    for (let index = pageCount - 5; index < pageCount; index++) {
      pages.push(index === pageIndex ? 'current' : (index + 1).toString());
    }
  } else {
    // middle of pagination list
    pages.push('1');
    pages.push('...');
    pages.push(pageIndex.toString());
    pages.push('current');
    pages.push((pageIndex + 2).toString());
    pages.push('...');
    pages.push(pageCount.toString());
  }

  return pages;
};

export const blobToBuffer = async (blob: Blob): Promise<Buffer> => {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const extractJSONTextFromLLMResponse = (llmResponse: string) => {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const jsRegex = /```js\s*([\s\S]*?)\s*```/;
  const jsonMatch = llmResponse.match(jsonRegex);
  const jsMatch = llmResponse.match(jsRegex);

  let isJsonMatch = true;
  if (!jsonMatch && !jsMatch) {
    throw new Error("Can't extract json");
  } else if (!jsonMatch) {
    isJsonMatch = false;
  }
  try {
    if (isJsonMatch) {
      JSON.parse(jsonMatch![1]);
    } else {
      JSON.parse(jsMatch![1]);
    }
  } catch {
    throw new Error("Can't extract json");
  }

  return isJsonMatch ? jsonMatch![1] : jsMatch![1];
};
