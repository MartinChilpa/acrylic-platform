import { Component, OnInit, inject } from '@angular/core';
import { AccountService } from '../../../services/account.service';
import { IDocumentResults } from '../../../interfaces/response/document.response';
import { FileDownloadDirective } from '../../../directives/file-download.directive';
import { AlertService } from '../../../services/alert.service';

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
  private _accountService = inject(AccountService);
  private _alertService = inject(AlertService);

  documents!: IDocumentResults[]

  ngOnInit(): void {
    this.getDocuments()
  }

  getDocuments() {
    this._accountService.getDocuments().subscribe(response => {
      this.documents = response.results
    })
  }

  deleteDocument(uuid: string) {
    this._accountService.deleteDocument(uuid).subscribe({
      next: () => {
        this._alertService.success("Document deleted successfully");
        this.getDocuments();
      }
    });
  }
}
