function welcome() {
    const lines = [
        '',
        '       Welcome to ' + '\x1b[1m\x1b[34mplover-js\x1b[0m' + ', an',
        ' Open Source project under the ' + '\x1b[32mEcho Open Source Licence (EOSL)\x1b[0m' + '.',
        '',
        ' Thank you for choosing ' + '\x1b[1m\x1b[34mplover-js\x1b[0m' + '. We invite you to',
        '  contribute, collaborate, and help shape the future.',
        ''
    ];

    const reset = '\x1b[0m';
    const blueBold = '\x1b[1m\x1b[34m';
    const maxLength = Math.max(...lines.map(line => line.replace(/\x1b\[[0-9;]*m/g, '').length));
    const horizontal = blueBold + '+' + '-'.repeat(maxLength + 2) + '+' + reset;

    console.log(horizontal);
    for (let rawLine of lines) {
        const cleanLen = rawLine.replace(/\x1b\[[0-9;]*m/g, '').length;
        const padding = ' '.repeat(maxLength - cleanLen);
        console.log(blueBold + '|' + reset + ' ' + rawLine + padding + ' ' + blueBold + '|' + reset);
    }
    console.log(horizontal);
}

module.exports = welcome;