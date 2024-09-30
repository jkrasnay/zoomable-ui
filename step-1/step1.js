import { h, render } from 'https://esm.sh/preact';
import { useReducer } from 'https://esm.sh/preact/hooks';


function reducer(state, action) {
  switch (action.type) {

    case 'pan': {
      const { dx, dy } = action;
      const [ x, y ] = state.pan;
      return {
        ...state,
        pan: [ x + dx, y + dy ]
      };
    }

    case 'zoom': {
      const { factor, cx, cy } = action;
      const zoom0 = state.zoom;
      const [ px0, py0 ] = state.pan;
      let zoom1 = zoom0 * factor;
      zoom1 = Math.min(Math.max(0.125, zoom1), 4);
      return {
        ...state,
        zoom: zoom1,
        pan: [ px0 + cx/zoom1 - cx/zoom0, py0 + cy/zoom1 - cy/zoom0 ],
      };
    }

    default:
      throw new Error('Unrecognized action: ' + action);
  }
}


function Diagram(props) {

  const initState = { zoom: 1, pan: [100, 100] };

  const [ state, dispatch ] = useReducer(reducer, initState);

  const { zoom, pan } = state;

  const diagramDiv = h('div',
    {
      class: 'zui-diagram',
      style: `transform: scale(${zoom}) translate(${pan[0]}px, ${pan[1]}px); transform-origin: top left`,
    },
    h('div',
      {
        style:
        {
          border: '2px solid black',
          'border-radius': '8px',
          padding: '32px',
          position: 'absolute',
        }
      }, 'Hello, world!'));

  const statsDiv = h('div',
    {
      style:
      {
        padding: '8px',
        position: 'absolute',
        bottom: 0,
      }
    },
    h('div', {}, `zoom: ${zoom}`),
    h('div', {}, `pan: ${pan[0]}, ${pan[1]}`),
  );

  const canvas = h('div',
    {
      class: 'zui-canvas',
      draggable: false,
      onwheel: (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
          // We want to zoom about the current cursor position in diagram coordinates
          // Start with e.clientX/clientY, which are relative to the viewport
          // Look at getBoundingClientRect for div.diagram, which gives us the origin
          // of the zoomed and translated diagram in viewport coordinates
          //
          // Look at getBoundingClientRect for div.canvas and subtract this from e.clientX/clientY
          //
          // Consider a point p in diagram space corresponding to the current cursor position.
          // Its x-coordinate in client space is (x_d + x_pan) * zoom.
          // After zooming, we want this to be the same, so
          //
          // (x_d + x_pan0) * zoom_0 = (x_d + x_pan1) * zoom_1
          //
          // Solving for pan1.x...
          //
          // (x_d + x_pan0) * zoom_0 / zoom_1 = x_d + x_pan1
          // x_pan1 = (x_d * x_pan0) * zoom_0 / zoom_1 - x_d
          //
          // Let's try subbing x_d to calculate in canvas space
          //
          // x_pan1 = (x_c / zoom_0 - x_pan0 + x_pan0) * zoom_0 / zoom_1 - x_c / zoom_0 + x_pan0
          // x_pan1 = (x_c / zoom_0) * zoom_0 / zoom_1 - x_c / zoom_0 + x_pan0
          // x_pan1 = x_c / zoom_1 - x_c / zoom_0 + x_pan0
          //
          //
          // x_d = x in diagram space
          // x_c = x in canvas space
          //
          // x_c = (x_d + x_pan) * zoom
          //
          // OR
          //
          // x_d = x_c / zoom - x_pan
          //
          const canvas = e.target.closest('.zui-canvas');
          const { x, y } = canvas.getBoundingClientRect();
          dispatch({ type: 'zoom', factor: e.deltaY < 0 ? 1.05 : 1/1.05, cx: e.clientX - x, cy: e.clientY - y });
        } else {
          //dispatch({ type: 'pan', dx: -Math.sign(e.deltaX) * 10 / zoom, dy: -Math.sign(e.deltaY) * 10 / zoom });
          dispatch({ type: 'pan', dx: -e.deltaX * 5 / zoom, dy: -e.deltaY * 5 / zoom });
        }
      },
    },
    statsDiv,
    diagramDiv);

  return canvas;

}

export { Diagram };
