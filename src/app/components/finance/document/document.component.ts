import { Component, OnInit, inject } from '@angular/core';
import { AccountService } from '../../../services/account.service';
import { IDocumentResults } from '../../../interfaces/response/document.response';
import { FileDownloadDirective } from '../../../directives/file-download.directive';

@Component({
  selector: 'acrylic-document',
  standalone: true,
  imports: [
    FileDownloadDirective
  ],
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss'
})
export class DocumentComponent implements OnInit {
  private _accountService = inject(AccountService)

  documents!: IDocumentResults[]

  ngOnInit(): void {
    this.getDocuments()
  }

  getDocuments() {
    this._accountService.getDocuments().subscribe(response => {
      this.documents = response.results
    })
  }
}
