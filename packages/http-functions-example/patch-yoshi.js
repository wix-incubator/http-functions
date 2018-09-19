const fs = require('fs');

const fileName = require.resolve('yoshi/config/webpack.config.common.js');
const content = fs.readFileSync(fileName).toString();
const patch = `
    rules: [
      {
        test: /\\.web\\.(js|ts)$/,
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

if (!content.includes('http-functions')) {
  fs.writeFileSync(fileName, content.replace(/\n\s*rules: \[\n/, patch));
  console.log('yoshi patched!');
}
