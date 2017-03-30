import "should";

function setup (action) {
  before(function (done) {
    this.fixture = document.createElement("div");
    document.body.appendChild(this.fixture);
    action.call(this, this.fixture, () => done());
  });
  after(function () {
    this.fixture.parentElement.removeChild(this.fixture);
  });
}



describe("Import a whole file", function () {
  setup(function (fixture, done) {
    let el = new HTMLImportElement;
    el.setAttribute("src", "base/test/content.html");
    fixture.appendChild(el);
    fixture.querySelector("html-import").ready.then(done);
  });

  it("should import a whole file", function () {
    let paragraphs = this.fixture.querySelectorAll("p");
    paragraphs.length.should.equal(2);
    paragraphs[0].innerHTML.should.equal("Lorem");
    paragraphs[1].innerHTML.should.equal("Ipsum");
  });

});



describe("Import single elements", function () {

  describe("Import only lorem", function () {
    setup(function (fixture, done) {
      let el = new HTMLImportElement;
      el.setAttribute("src", "base/test/content.html#lorem");
      fixture.appendChild(el);
      fixture.querySelector("html-import").ready.then(done);
    });
    it("should import only one element", function () {
      let paragraphs = this.fixture.querySelectorAll("p");
      paragraphs.length.should.equal(1);
      paragraphs[0].innerHTML.should.equal("Lorem");
    });
  });

  describe("Import only ipsum", function () {
    setup(function (fixture, done) {
      let el = new HTMLImportElement;
      el.setAttribute("src", "base/test/content.html#ipsum");
      fixture.appendChild(el);
      fixture.querySelector("html-import").ready.then(done);
    });
    it("should import only one element", function () {
      let paragraphs = this.fixture.querySelectorAll("p");
      paragraphs.length.should.equal(1);
      paragraphs[0].innerHTML.should.equal("Ipsum");
    });

  });

});