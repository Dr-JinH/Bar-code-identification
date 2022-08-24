/**
 * @Author: your name
 * @Date: 2022-05-08 23:14:25
 * @LastEditTime: 2022-05-28 23:13:06
 * @LastEditors: your name
 * @Description: 
 * @FilePath: \web\条形码实验\js\example.js
 * @可以输入预定的版权声明、个性签名、空行等
 */
/*
 * @Author: error: git config user.name && git config user.email & please set dead value or install git
 * @Date: 2022-05-24 13:17:56
 * @LastEditors: error: git config user.name && git config user.email & please set dead value or install git
 * @LastEditTime: 2022-05-24 20:10:04
 * @FilePath: \web\条形码实验\js\example.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
var example = function (num)
{
    var picture = document.getElementById("picture");
    switch (num)
    {
        case 1:
            picture.src = "./img/demo-2.png";
            break;
        case 2:
            picture.src = "./img/demo-7.png";
            break;
        case 3:
            picture.src = "./img/demo-5-倒置.png";
            break;
    }
}