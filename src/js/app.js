import $ from 'jquery';
import {parseCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#codePlaceholder2').val();
        let parsedCode = parseCode(codeToParse,args);
        let x = document.getElementById('parsedCode');
        x.innerHTML = parsedCode;
        // $('#parsedCode').val(parsedCode);
    });
});
