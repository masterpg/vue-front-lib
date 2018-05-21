import '@polymer/polymer/polymer-legacy.js';

const baseSize = 16;
const spacers = [
  0, 
  baseSize * 0.25, 
  baseSize * 0.5, 
  baseSize,
  baseSize * 1.25,
  baseSize * 1.5,
  baseSize * 1.75,
  baseSize * 2,
  baseSize * 2.25,
  baseSize * 2.5,
  baseSize * 2.75,
  baseSize * 3,
];

let variables = '';
for (let i = 0; i < spacers.length; i++) {
  const spacer = spacers[i];
  variables += `--spacer-${i}: ${spacer}px;\n`;
}

let classes = '';
classes += '.mx-auto { margin-left: auto !important; margin-right: auto !important; }\n';
for (let i = 0; i < spacers.length; i++) {
  const spacer = spacers[i];
  classes += `.mt-${i} { margin-top: ${spacer}px !important; }\n`;
  classes += `.mr-${i} { margin-right: ${spacer}px !important; }\n`;
  classes += `.mb-${i} { margin-bottom: ${spacer}px !important; }\n`;
  classes += `.ml-${i} { margin-left: ${spacer}px !important; }\n`;
  classes += `.mx-${i} { margin-left: ${spacer}px !important; margin-right: ${spacer}px !important; }\n`;
  classes += `.my-${i} { margin-top: ${spacer}px !important; margin-bottom: ${spacer}px !important; }\n`;
  classes += `.ma-${i} { margin: ${spacer}px ${spacer}px !important; }\n`;

  classes += `.pt-${i} { padding-top: ${spacer}px !important; }\n`;
  classes += `.pr-${i} { padding-right: ${spacer}px !important; }\n`;
  classes += `.pb-${i} { padding-bottom: ${spacer}px !important; }\n`;
  classes += `.pl-${i} { padding-left: ${spacer}px !important; }\n`;
  classes += `.px-${i} { padding-left: ${spacer}px !important; padding-right: ${spacer}px !important; }\n`;
  classes += `.py-${i} { padding-top: ${spacer}px !important; padding-bottom: ${spacer}px !important; }\n`;
  classes += `.pa-${i} { padding: ${spacer}px ${spacer}px !important; }\n`;
}

const $_documentContainer = document.createElement('template');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `
<custom-style>
  <style is="custom-style">
    html {
      ${variables}
    }
    ${classes}
  </style>
</custom-style>
`;

document.head.appendChild($_documentContainer.content);
