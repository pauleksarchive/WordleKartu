/* 
    Hello!
    This is a very bad algorythm
    I apologize
    I already spent almost 6 hours today on this project as of time of writing this.
*/

const { LetterPlacements } = require('./Constants');

/**
 * @param {String} realWord Word that the answer is based on
 * @param {String} wordToCheck Checked word
 * @returns {Array} 
 */

module.exports = (realWord, wordToCheck) => {
    if (realWord.toLowerCase() == wordToCheck.toLowerCase()) return [LetterPlacements.Correct, LetterPlacements.Correct, LetterPlacements.Correct, LetterPlacements.Correct, LetterPlacements.Correct];

    let splitRealWord = realWord.split(''), splitWordToCheck = wordToCheck.split(''), results = [];
    splitRealWord.forEach((w, i) => {
        if (splitRealWord[i] == splitWordToCheck[i]) return results.push(LetterPlacements.Correct);
        if (splitRealWord.includes(splitWordToCheck[i])) return results.push(LetterPlacements.PartlyCorrect);
        return results.push(LetterPlacements.Incorrect);
    })

    return results;
}