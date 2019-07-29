const fs = require('fs');

const fileName = require.resolve('yoshi/config/webpack.config.js');
const content = fs.readFileSync(fileName).toString();
const patch = `
      {
        test: /\.web\.(js|ts)$/,
        use: [
          {
            loader: 'http-functions-webpack',
            options: {
              endpoint: '/_functions',
            },
          },
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                allowJs: true,
              },
            },
          },
        ],
      },
`;

console.log(content.indexOf('// Rules for TS / TSX'));

if (!content.includes('http-functions')) {
  fs.writeFileSync(
    fileName,
    content
      .replace('// Rules for TS / TSX', patch)
      .replace('symlinks: false', 'symlinks: true'),
  );
  console.log(content.indexOf('// Rules for TS / TSX'));

  console.log('yoshi patched!');
}
