document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;

    fetch('template.docx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const zip = new PizZip(data);
            const doc = new Docxtemplater(zip);

            doc.setData({
                name: name,
            });

            try {
                doc.render();
            } catch (error) {
                console.error(error);
                return;
            }

            const out = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(out);
            link.download = `${name}_document.docx`;
            link.click();
        })
        .catch(err => console.error(err));
});
