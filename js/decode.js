//解码
function decode()
{
    var img = document.getElementById("picture");
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var width = img.width;
    var height = img.height;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(img, 0, 0, width, height);
    var imageData = context.getImageData(0, 0, width, height);
    console.log("图片像素数据：");
    console.log(imageData);

    //根据数据获取灰度图
    var grayData = getGrayData(imageData, height, width);

    //二值化,黑色使用1表示，白色使用0表示
    var threshold = OTSUAlgorithm(imageData);
    var binaryData = getbinaryData(grayData, threshold, height, width);

    //取图片中间直线
    var middleLine = binaryData[Math.trunc(height / 2)];

    //计算条码最短宽度,获取条码开始位置
    var minWidth_p1 = getMinWidth(middleLine);
    var minWidth = minWidth_p1[0];
    var p1 = minWidth_p1[1];
    console.log("条码像素最短宽度：" + minWidth);

    //条码数据放入codeArray中
    var codeArray = getcodeArray(minWidth, middleLine, p1);
    console.log("codeArray数据: " + codeArray);

    //codeArray转换为特殊字符串，用于获取最终结果
    var code = getcode(codeArray);
    console.log("传入getResult的code参数" + code);

    //第一次转化结果
    var finallRes = getResult(code);
    console.log("第一次转化结果：" + finallRes);

    //第一次失败了，反转图片试一试？
    if (finallRes == "ERROR")
    {
        //上下翻转context
        context.clearRect(0, 0, width, height);
        //位移来做镜像翻转
        context.translate(width, 0);
        context.scale(-1, 1); //左右镜像翻转

        context.translate(0, height);
        context.scale(1, -1); //上下镜像翻转
        context.drawImage(img, 0, 0, width, height);

        imageData = context.getImageData(0, 0, width, height);
        console.log("图片像素数据：");
        console.log(imageData);

        //根据数据获取灰度图
        var grayData = getGrayData(imageData, height, width);

        //二值化,黑色使用1表示，白色使用0表示
        var threshold = OTSUAlgorithm(imageData);
        var binaryData = getbinaryData(grayData, threshold, height, width);

        //取图片中间直线
        var middleLine = binaryData[Math.trunc(height / 2)];

        //计算条码最短宽度,获取条码开始位置
        var minWidth_p1 = getMinWidth(middleLine);
        var minWidth = minWidth_p1[0];
        var p1 = minWidth_p1[1];
        console.log("条码像素最短宽度：" + minWidth);

        //条码数据放入codeArray中
        var codeArray = getcodeArray(minWidth, middleLine, p1);
        console.log("codeArray数据: " + codeArray);

        //codeArray转换为特殊字符串，用于获取最终结果
        var code = getcode(codeArray);
        console.log("传入getResult的code参数" + code);

        //第二次转化结果
        var finallRes = getResult(code);
        console.log("第二次转化结果：" + finallRes);
    }

    //对finallRes进行处理，获取最终结果
    var finalResWithAI = getfinalResWithAI(finallRes);

    //finallRes数组  显示在id="result-text"的标签中
    var resultText = document.getElementById("result-text");
    //清空标签中的内容
    resultText.innerHTML = "";
    var h3 = document.createElement("h3");
    h3.innerHTML = "识别结果";
    resultText.appendChild(h3);
    //添加结果
    for (var i = 0; i < finallRes.length; i++)
    {
        var span = document.createElement("span");
        span.setAttribute("class", "result-span");
        span.innerHTML = finallRes[i] + " ";
        resultText.appendChild(span);
    }
    var h2 = document.createElement("h2");
    h2.innerHTML = "最终结果";
    resultText.appendChild(h2);
    var span2 = document.createElement("span");
    span2.setAttribute("class", "result-span");
    span2.innerHTML = finalResWithAI;
    resultText.appendChild(span2);
}

/**
 * @description: 根据数据返回灰度图
 * @param {*} imageData
 * @param {*} height
 * @param {*} width
 * @return {*}
 */
function getGrayData(imageData, height, width)
{
    var grayData = [];
    var line = [];
    for (var i = 0; i < height; i++)
    {
        line = [];
        for (var j = 0; j < width; j++)
        {
            var r = Math.pow(imageData.data[(i * width + j) * 4], 2.2);
            var g = Math.pow(1.5 * imageData.data[(i * width + j) * 4 + 1], 2.2);
            var b = Math.pow(0.6 * imageData.data[(i * width + j) * 4 + 2], 2.2);
            var son = r + g + b;
            var father = Math.pow(1, 2.2) + Math.pow(1.5, 2.2) + Math.pow(0.6, 2.2);
            var gray = Math.pow(son / father, 1 / 2.2);
            gray = Math.trunc(gray);
            line.push(gray);
        }
        grayData.push(line);
    }
    return grayData;
}

/**
 * @description: 一维OTSU图像处理算法
 * @param {*} canvasData
 * @return {*} nThresh
 */
function OTSUAlgorithm(canvasData)
{
    var m_pFstdHistogram = new Array();//表示灰度值的分布点概率
    var m_pFGrayAccu = new Array();//其中每一个值等于m_pFstdHistogram中从0到当前下标值的和
    var m_pFGrayAve = new Array();//其中每一值等于m_pFstdHistogram中从0到当前指定下标值*对应的下标之和
    var m_pAverage = 0;//值为m_pFstdHistogram【256】中每一点的分布概率*当前下标之和
    var m_pHistogram = new Array();//灰度直方图
    var i, j;
    var temp = 0, fMax = 0;//定义一个临时变量和一个最大类间方差的值
    var nThresh = 0;//最优阀值
    //初始化各项参数
    for (i = 0; i < 256; i++)
    {
        m_pFstdHistogram[i] = 0;
        m_pFGrayAccu[i] = 0;
        m_pFGrayAve[i] = 0;
        m_pHistogram[i] = 0;
    }
    //获取图像的像素
    var pixels = canvasData.data;
    //下面统计图像的灰度分布信息
    for (i = 0; i < pixels.length; i += 4)
    {
        //获取r的像素值，因为灰度图像，r=g=b，所以取第一个即可
        var r = pixels[i];
        m_pHistogram[r]++;
    }
    //下面计算每一个灰度点在图像中出现的概率
    var size = canvasData.width * canvasData.height;
    for (i = 0; i < 256; i++)
    {
        m_pFstdHistogram[i] = m_pHistogram[i] / size;
    }
    //下面开始计算m_pFGrayAccu和m_pFGrayAve和m_pAverage的值
    for (i = 0; i < 256; i++)
    {
        for (j = 0; j <= i; j++)
        {
            //计算m_pFGaryAccu[256]
            m_pFGrayAccu[i] += m_pFstdHistogram[j];
            //计算m_pFGrayAve[256]
            m_pFGrayAve[i] += j * m_pFstdHistogram[j];
        }
        //计算平均值
        m_pAverage += i * m_pFstdHistogram[i];
    }
    //下面开始就算OSTU的值，从0-255个值中分别计算ostu并寻找出最大值作为分割阀值
    for (i = 0; i < 256; i++)
    {
        temp = (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i])
            * (m_pAverage * m_pFGrayAccu[i] - m_pFGrayAve[i])
            / (m_pFGrayAccu[i] * (1 - m_pFGrayAccu[i]));
        if (temp > fMax)
        {
            fMax = temp;
            nThresh = i;
        }
    }
    return nThresh
}

/**
 * @description: 根据阈值获取二值化表示的图像数据
 * @param {*} grayData
 * @param {*} threshold
 * @param {*} height
 * @param {*} width
 * @return {*}
 */
function getbinaryData(grayData, threshold, height, width)
{
    var binaryData = [];
    for (var i = 0; i < height; i++)
    {
        line = [];
        for (var j = 0; j < width; j++)
        {
            if (grayData[i][j] > threshold)
            {
                line.push(0);
            }
            else
            {
                line.push(1);
            }
        }
        binaryData.push(line);
    }
    return binaryData;
}

/**
 * @description: 获取条码的宽度，和条码开始的位置
 * @param {*} middleLine
 * @return {*} minwidth,p1
 */
function getMinWidth(middleLine)
{
    var res = [];
    var minWidth = 0;
    var p1 = 0; //条码开始位置下标
    var p2 = 0;
    var minWidth = 0;
    for (var i = 0; i < middleLine.length; i++)
    {
        for (var j = 0; j < 4; j++)
        {
            if (middleLine[i] == 1)
            {
                p1 = i;
                p2 = i + (4 * (j + 1));
            }
            var star = middleLine.slice(p1, p2);
            let a = [1, 1, 0, 1];
            let b = [1, 1, 1, 1, 0, 0, 1, 1];
            let c = [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1];
            let d = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1];
            if (JSON.stringify(star) == JSON.stringify(a))
            {
                minWidth = 1;
                i = middleLine.length;  //外层循环结束
                break;
            }
            if (JSON.stringify(star) == JSON.stringify(b))
            {
                minWidth = 2;
                i = middleLine.length;
                break;
            }
            if (JSON.stringify(star) == JSON.stringify(c))
            {
                minWidth = 3;
                i = middleLine.length;
                break;
            }
            if (JSON.stringify(star) == JSON.stringify(d))
            {
                minWidth = 4;
                i = middleLine.length;
                break;
            }
        }
    }
    res.push(minWidth);
    res.push(p1);
    return res;
}

/**
 * @description: 获取最终的条码数据
 * @param {*} minWidth
 * @param {*} middleLine
 * @param {*} p1
 * @return {*}
 */
function getcodeArray(minWidth, middleLine, p1)
{
    var p3 = 0; //条码结束位置下标
    for (var i = middleLine.length; i > p1; i--)
    {
        if (minWidth === 1)
        {
            let end = [1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1];
            if (JSON.stringify(middleLine.slice(i - 13, i)) == JSON.stringify(end))
            {
                p3 = i - 1;
                break;
            }
        }
        if (minWidth === 2)
        {
            let end = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1];
            if (JSON.stringify(middleLine.slice(i - 26, i)) == JSON.stringify(end))
            {
                p3 = i - 1;
                break;
            }
        }
        if (minWidth === 3)
        {
            let end = [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1
                , 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1];
            if (JSON.stringify(middleLine.slice(i - 39, i)) == JSON.stringify(end))
            {
                p3 = i - 1;
                break;
            }
        }
        if (minWidth === 4)
        {
            let end = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
                1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1];
            if (JSON.stringify(middleLine.slice(i - 52, i)) == JSON.stringify(end))
            {
                p3 = i - 1;
                break;
            }
        }
    }

    console.log("条码在像素中位置：" + p1, p3);
    var codeArray = [];
    for (var i = p1; i < p3 + 1; i = i + minWidth)
    {
        codeArray.push(middleLine[i]);
    }
    return codeArray;
}

/**
 * @description: 根据codeArray获取特殊条码字符串用于解码
 * @param {*} codeArray
 * @return {*}
 */
function getcode(codeArray)
{
    var code = "";
    codeArray.push(0);
    var code = "";
    var cur1 = 0;
    var cur2 = 0;
    var num = 0;

    for (var i = 1; i < codeArray.length; i++)
    {
        if (codeArray[i] != codeArray[i - 1])
        {
            cur2 = i;
            num = cur2 - cur1;
            code = code + num.toString();
            cur1 = cur2;
        }
    }
    console.log("条码字符串：" + code);
    return code;
}

/**
 * @description: 根据条码字符串转化结果
 * @param {*} code
 * @return {*}  result
 */
function getResult(code)
{
    let result = [];
    //按组分割码
    let res = [];
    let codeWithoutEnd = code.slice(0, code.length - 7);
    let codeArray = codeWithoutEnd;
    for (let i = 0; i < codeArray.length; i = i + 6)
    {
        res.push(codeArray.substr(i, 6));
    }
    console.log("码的结果：" + res);

    //获取码集
    let gs1128 = get128();
    //确定编码规则
    let stratABC = 0;
    for (let i = 0; i < gs1128.length; i++)
    {
        if (res[0] == gs1128[i][4])
        {
            result.push(gs1128[i][1]);
            if (gs1128[i][1] == "StartA")
                stratABC = 1;
            if (gs1128[i][1] == "StartB")
                stratABC = 2;
            if (gs1128[i][1] == "StartC")
                stratABC = 3;
        }
    }

    //根据码集规则解析码
    for (let i = 1; i < res.length; i++)
    {
        for (let j = 0; j < gs1128.length; j++)
        {
            if (res[i] == gs1128[j][4])
            {
                switch (stratABC)
                {
                    case 1:
                        if (gs1128[j][1] == "CODEB")
                        {
                            stratABC = 2;
                            result.push(gs1128[j][1]);
                        }
                        if (gs1128[j][1] == "CODEC")
                        {
                            stratABC = 3;
                            result.push(gs1128[j][1]);
                        }
                        else if (true)
                        {
                            result.push(gs1128[j][1]);
                        }
                        break;
                    case 2:
                        if (gs1128[j][2] == "CODEA")
                        {
                            stratABC = 1;
                            result.push(gs1128[j][2]);
                        }
                        if (gs1128[j][2] == "CODEC")
                        {
                            stratABC = 3;
                            result.push(gs1128[j][2]);
                        }
                        else if (true)
                        {
                            result.push(gs1128[j][2]);
                        }
                        break;
                    case 3:
                        if (gs1128[j][3] == "CODEA")
                        {
                            stratABC = 1;
                            result.push(gs1128[j][3]);
                        }
                        if (gs1128[j][3] == "CODEB")
                        {
                            stratABC = 2;
                            result.push(gs1128[j][3]);
                        }
                        else if (true)
                        {
                            result.push(gs1128[j][3]);
                        }
                        break;
                }
            }
        }
    }
    result.push("STOP");
    if (result.length == 1)
        return "ERROR";
    return result;
}

/**
 * @description: 寻找到AI标识符
 * @param {*} finallRes
 * @return {*}
 */
function getfinalResWithAI(finallRes)
{
    //将结果数组转化为字符串
    let finalResStr = "";
    for (let i = 0; i < finallRes.length; i++)
    {
        finalResStr = finalResStr + finallRes[i];
    }

    //去除finalResStr中的'StartA','StartB','StartC','CODEA','CODEB','CODEC','STOP'
    let finalResStrWithoutStart = finalResStr.replace(/StartA|StartB|StartC|CODEA|CODEB|CODEC|STOP/g, "");
    finalResStr = finalResStrWithoutStart;
    //去除校验位，即最后两位
    let finalResStrWithoutCheck = finalResStr.slice(0, finalResStr.length - 2);
    finalResStr = finalResStrWithoutCheck;
    console.log("结果字符串：" + finalResStr);

    var AI_1 = new Map([['00', 20], ['01', 16], ['02', 16], ['11', 8], ['12', 8], ['13', 8],
    ['15', 8], ['17', 8], ['20', 4], ['32', 10], ['31', 10], ['33', 10], ['34', 10],
    ['35', 10], ['36', 10], ['41', 16], ['402', 20], ['410', 16], ['413', 16]]); //定长

    var AI_2 = new Map([['401', 33], ['403', 33], ['420', 23], ['421', 15]]); //非定长

    //着手开始找AI标识符

    var location = 4; //第一个AI标识符的起始位置
    var if_end = 0; //是否结束
    var AI_Array = []; //存储AI标识符地址
    for (let j = 0; j < 150 && !if_end; j++) //最多150次
    {
        if (AI_1.has(finalResStr.slice(location, location + 2)))
        {
            //AI标识符是定长的
            console.log("AI标识符是定长的" + finalResStr.slice(location, location + 2) + ':' + AI_1.get(finalResStr.slice(location, location + 2)));
            if (finalResStr.slice(location, location + 2) >= 31&& finalResStr.slice(location, location + 2) <= 36)
            {
                AI_Array.push(location);
                AI_Array.push(location + 4);
            }
            else
            {
                AI_Array.push(location);
                AI_Array.push(location + 2);
            }

            location = location + AI_1.get(finalResStr.slice(location, location + 2));//移动位置
            console.log("location:" + location);
        }
        if (AI_1.has(finalResStr.slice(location, location + 3)))
        {
            //标识符是定长的
            console.log("AI标识符是定长的" + finalResStr.slice(location, location + 3) + ':' + AI_1.get(finalResStr.slice(location, location + 3)));
            AI_Array.push(location);
            AI_Array.push(location + 3);
            location = location + AI_1.get(finalResStr.slice(location, location + 3));//移动位置
            console.log("location:" + location);
        }
        if (AI_2.has(finalResStr.slice(location, location + 3)))
        {
            //标识符是非定长的
            console.log("AI标识符是非定长的" + finalResStr.slice(location, location + 3) + ':' + AI_2.get(finalResStr.slice(location, location + 3)));
            AI_Array.push(location);
            AI_Array.push(location + 3);
            //需要查看在最大长度内是否有'FNC1'
            for (let i = location + 3; ; i++)
            {
                if (finalResStr.slice(i, i + 4) == 'FNC1')
                {
                    //未达到最大长度
                    console.log("未达到最大长度,下一个AI标识符开始位置：" + (i + 4));
                    location = i + 4;
                    break;
                }
                else if (i == location + AI_2.get(finalResStr.slice(location, location + 3)) - 1)
                {
                    //达到最大长度
                    console.log("达到最大长度,下一个AI标识符开始位置：" + (i + 1));
                    location = i + 1;
                    break;
                }
            }
        }
        if (location >= finalResStr.length)
        {
            console.log(AI_Array);
            if_end = 1;
        }
    }

    //着手给AI标识符加()
    var res = [];
    //将字符串finalResStr拆分成字符串数组，依据AI_Array中的位置
    for (let i = 0; i < AI_Array.length; i++)
    {
        res.push(finalResStr.slice(AI_Array[i], AI_Array[i + 1]));
    }
    console.log(res);
    //给res偶数位的字符串加()
    for (let i = 0; i < res.length; i++)
    {
        if (i % 2 == 0)
        {
            res[i] = '(' + res[i] + ')';
        }
    }
    console.log(res);
    //将res数组拼接成字符串
    var resStr = '';
    for (let i = 0; i < res.length; i++)
    {
        resStr += res[i];
    }
    console.log(resStr);
    return resStr;
}


/**
 * @description: GS1-128编码字符集
 * @param {*}  
 * @return {*}  gs1_128
 */
function get128()
{
    var str = "0 SP SP 00 212222 bbsbbssbbss 1 ! ! 01 222122 bbssbbsbbss 2 “ “ 02 222221 bbssbbssbbs 3 # # 03 121223 bssbssbbsss 4 $ $ 04 121322 bssbsssbbss 5 % % 05 131222 bsssbssbbss 6 & & 06 122213 bssbbssbsss 7 ‘ ‘ 07 122312 bssbbsssbss 8 ( ( 08 132212 bsssbbssbss 9 ) ) 09 221213 bbssbssbsss 10 * * 10 221312 bbssbsssbss 11 + + 11 231212 bbsssbssbss 12 ， ， 12 112232 bsbbssbbbss 13 - - 13 122132 bssbbsbbbss 14 . . 14 122231 bssbbssbbbs 15 / / 15 113222 bsbbbssbbss 16 0 0 16 123122 bssbbbsbbss 17 1 1 17 123221 bssbbbssbbs 18 2 2 18 223211 bbssbbbssbs 19 3 3 19 221132 bbssbsbbbss 20 4 4 20 221231 bbssbssbbbs 21 5 5 21 213212 bbsbbbssbss 22 6 6 22 223112 bbssbbbsbss 23 7 7 23 312131 bbbsbbsbbbs 24 8 8 24 311222 bbbsbssbbss 25 9 9 25 321122 bbbssbsbbss 26 : : 26 321221 bbbssbssbbs 27 ; ; 27 312212 bbbsbbssbss 28 < < 28 322112 bbbssbbsbss 29 = = 29 322211 bbbssbbssbs 30 > > 30 212123 bbsbbsbbsss 31 ? ? 31 212321 bbsbbsssbbs 32 @ @ 32 232121 bbsssbbsbbs 33 A A 33 111323 bsbsssbbsss 34 B B 34 131123 bsssbsbbsss 35 C C 35 131321 bsssbsssbbs 36 D D 36 112313 bsbbsssbsss 37 E E 37 132113 bsssbbsbsss 38 F F 38 132311 bsssbbsssbs 39 G G 39 211313 bbsbsssbsss 40 H H 40 231113 bbsssbsbsss 41 I I 41 231311 bbsssbsssbs 42 J J 42 112133 bsbbsbbbsss 43 K K 43 112331 bsbbsssbbbs 44 L L 44 132131 bsssbbsbbbs 45 M M 45 113123 bsbbbsbbsss 46 N N 46 113321 bsbbbsssbbs 47 O O 47 133121 bsssbbbsbbs 48 P P 48 313121 bbbsbbbsbbs 49 Q Q 49 211331 bbsbsssbbbs 50 R R 50 231131 bbsssbsbbbs 51 S S 51 213113 bbsbbbsbsss 52 T T 52 213311 bbsbbbsssbs 53 U U 53 213131 bbsbbbsbbbs 54 V V 54 311123 bbbsbsbbsss 55 W W 55 311321 bbbsbsssbbs 56 X X 56 331121 bbbsssbsbbs 57 Y Y 57 312113 bbbsbbsbsss 58 Z Z 58 312311 bbbsbbsssbs 59 [ [ 59 332111 bbbsssbbsbs 60 \ \ 60 314111 bbbsbbbbsbs 61 ] ] 61 221411 bbssbssssbs 62 ^ ^ 62 431111 bbbbsssbsbs 63 _ _ 63 111224 bsbssbbssss 64 NUL ` 64 111422 bsbssssbbss 65 SOH a 65 121124 bssbsbbssss 66 STX b 66 121421 bssbssssbbs 67 ETX c 67 141122 bssssbsbbss 68 EOT d 68 141221 bssssbssbbs 69 ENQ e 69 112214 bsbbssbssss 70 ACK f 70 112412 bsbbssssbss 71 BEL g 71 122114 bssbbsbssss 72 BS h 72 122411 bssbbssssbs 73 HT i 73 142112 bssssbbsbss 74 LF j 74 142211 bssssbbssbs 75 VT k 75 241211 bbssssbssbs 76 FF I 76 221114 bbssbsbssss 77 CR m 77 413111 bbbbsbbbsbs 78 SO n 78 241112 bbssssbsbss 79 SI o 79 134111 bsssbbbbsbs 80 DLE p 80 111242 bsbssbbbbss 81 DC1 q 81 121142 bssbsbbbbss 82 DC2 r 82 121241 bssbssbbbbs 83 DC3 s 83 114212 bsbbbbssbss 84 DC4 t 84 124112 bssbbbbsbss 85 NAK u 85 124211 bssbbbbssbs 86 SYN v 86 411212 bbbbsbssbss 87 ETB w 87 421112 bbbbssbsbss 88 CAN x 88 421211 bbbbssbssbs 89 EM y 89 212141 bbsbbsbbbbs 90 SUB z 90 214121 bbsbbbbsbbs 91 ESC { 91 412121 bbbbsbbsbbs 92 FS | 92 111143 bsbsbbbbsss 93 GS } 93 111341 bsbsssbbbbs 94 RS ~ 94 131141 bsssbsbbbbs 95 US DEL 95 114113 bsbbbbsbsss 96 FNC3 FNC3 96 114311 bsbbbbsssbs 97 FNC2 FNC2 97 411113 bbbbsbsbsss 98 SHIFT SHIFT 98 411311 bbbbsbsssbs 99 CODEC CODEC 99 113141 bsbbbsbbbbs 100 CODEB FNC4 CODEB 114131 bsbbbbsbbbs 101 FNC4 CODEA CODEA 311141 bbbsbsbbbbs 102 FNC1 FNC1 FNC1 411131 bbbbsbsbbbs 103 StartA StartA StartA 211412 bbsbssssbss 104 StartB StartB StartB 211214 bbsbssbssss 105 StartC StartC StartC 211232 bbsbssbbbss 106 Stop Stop Stop 2331112 bbsssbbbsbsbb";
    var data = str.split(" ");

    var gs1_128 = [];
    let line = [];
    for (var i = 0; i < data.length; i += 6) 
    {
        line = [];
        line.push(data[i]);
        line.push(data[i + 1]);
        line.push(data[i + 2]);
        line.push(data[i + 3]);
        line.push(data[i + 4]);
        line.push(data[i + 5]);
        gs1_128.push(line);
    }
    return gs1_128;
}