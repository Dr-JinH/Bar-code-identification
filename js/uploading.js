//上传图片
function previewHandle(fileDOM)
{
    var file = fileDOM.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e)
    {
        document.getElementById("picture").src = this.result;
    }
}